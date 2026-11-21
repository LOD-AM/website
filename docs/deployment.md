# Deployment

```
push to main ──► GitHub Actions "build" ──► npm ci, npm run build, npm run check
                                         └─► (only if all passed) push _site/ to branch `deploy`
                                                     │
                                       GitHub webhook (push to deploy)
                                                     ▼
                              web server: git pull of `deploy`, serve the files as is
```

- **PRs** are built and checked but never deployed.
- The `deploy` branch contains only the built site, one commit per deployment
  ("Deploy <source sha>", with a link to the source commit). Never edit it by hand.
- The server needs **no Node.js** and runs no build.

## Server setup (one-time)

1. Clone only the `deploy` branch into the directory the web server serves:
   ```bash
   git clone --branch deploy --single-branch --depth 1 \
     https://github.com/LOD-AM/website.git /srv/www/lod-am.net
   ```
   (Use your actual document root. The branch exists after the first push to `main` that has this workflow.)

2. Webhook handler: on a push event for `refs/heads/deploy`, run:
   ```bash
   #!/bin/sh
   set -e
   cd /srv/www/lod-am.net
   git fetch --depth 1 origin deploy
   git reset --hard origin/deploy   # server copy always equals the branch
   git clean -fd
   ```
   - Ignore pushes to other branches (check `ref` in the payload). Otherwise every push to `main` triggers a useless pull.
   - Verify the `X-Hub-Signature-256` header with the webhook secret.

3. **Don't serve `.git/`.** The checkout contains a `.git` directory, and with `deploy` the
   checkout *is* the document root. The nginx config below blocks it.

4. The old server-side build (`npm ci && npx @11ty/eleventy`) can be removed once the webhook serves the `deploy` branch.

## Web server (nginx)

Nginx Proxy Manager (TLS, public name) forwards to an nginx that serves the static files on
port 8080 (`/etc/nginx/sites-available/lod-am`). Recommended config:

```nginx
server {
    listen 8080;
    server_name _;

    # today: /var/www/lod-am-website/_site (main checkout, built on the server)
    # with deploy (#11): the deploy checkout itself, e.g. /var/www/lod-am.net
    root /var/www/lod-am-website/_site;
    index index.html;

    # the site's own 404 page instead of nginx's default one
    error_page 404 /404.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # never serve git metadata (the deploy checkout has .git/ inside the root)
    location ~ /\.git {
        return 404;
    }

    # RDF downloads (/data/<key>.ttl, /id/<kind>/<uuid>.ttl) as Turtle, not octet-stream.
    # `types` inside a location replaces the MIME map only there.
    location ~* \.ttl$ {
        types { }
        default_type text/turtle;
        charset utf-8;
        charset_types text/turtle;
    }

    gzip on;
    # text/html is always compressed; the rest only if listed
    gzip_types text/css application/javascript application/json application/ld+json
               text/xml application/xml application/atom+xml image/svg+xml text/turtle;
}
```

Apply: `sudo nginx -t && sudo systemctl reload nginx`. Check:
```bash
curl -s -o /dev/null -w '%{http_code}\n' https://lod-am.net/.git/config          # 404
curl -s https://lod-am.net/does-not-exist/ | grep -o '<title>[^<]*'              # the site's 404 page
curl -sI https://lod-am.net/data/hauptmann2002chemical.ttl | grep -i content-type  # text/turtle
```
Rollback: restore the previous file and reload.

## Rollback

Every deployment is one commit on `deploy`. To go back on the server:
```bash
cd /srv/www/lod-am.net && git fetch --depth 20 origin deploy && git log --oneline origin/deploy
git reset --hard <commit>      # temporary: the next deployment overwrites it
```
For a lasting rollback, revert the change on `main`; the workflow deploys the result.

## Redeploy without a change

GitHub → Actions → **build** → *Run workflow* (on `main`).
