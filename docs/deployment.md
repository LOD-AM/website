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
- The server runs no build (Node.js stays only for the webhook listener).

## Server (live since 2026-11-21, website#11)

| What | Where |
|---|---|
| Document root | `/var/www/lod-am.net`: shallow clone of `deploy` only, owned by `www-data` |
| Webhook listener | `lod-am-webhook.service` → `/usr/bin/node /opt/webhook-listener.js`, user `www-data`; secret in `/etc/lod-am-webhook.env` (`EnvironmentFile`, mode 600, never in the unit or the repo) |
| Deploy script | `/opt/deploy-lod-am.sh`, log `/var/log/lod-am-deploy.log` |
| Web server | nginx, `/etc/nginx/sites-available/lod-am` (below) |
| Old setup (rollback) | `/var/www/lod-am-website` (main checkout, built on the server), script `/opt/deploy-lod-am-main.sh.bak` |

One-time clone:
```bash
sudo mkdir /var/www/lod-am.net && sudo chown www-data:www-data /var/www/lod-am.net
sudo -u www-data git clone --branch deploy --single-branch --depth 1 \
  https://github.com/LOD-AM/website.git /var/www/lod-am.net
```

`/opt/deploy-lod-am.sh` (run by the listener on a push):
```bash
#!/bin/bash
set -euo pipefail

SITE_DIR="/var/www/lod-am.net"
LOG_FILE="/var/log/lod-am-deploy.log"

exec >>"$LOG_FILE" 2>&1          # git errors land in the log too
exec 9>/tmp/lod-am-deploy.lock   # one deployment at a time
flock 9

echo "$(date) - Starting deployment"
cd "$SITE_DIR"
git fetch --depth 1 origin deploy
git reset --hard FETCH_HEAD      # server copy always equals the branch
git clean -fdx
echo "$(date) - Deployed: $(git log -1 --format=%s)"
```
A webhook call for a push to `main` is harmless: the script fetches the unchanged `deploy`
branch. The real deployment follows when the Action pushes to `deploy`. Test by hand:
`sudo -u www-data /opt/deploy-lod-am.sh && tail -3 /var/log/lod-am-deploy.log`.

The checkout contains `.git/` inside the document root; the nginx config blocks it.

## Web server (nginx)

Nginx Proxy Manager (TLS, public name) forwards to an nginx that serves the static files on
port 8080 (`/etc/nginx/sites-available/lod-am`). Recommended config:

```nginx
server {
    listen 8080;
    server_name _;

    # the deploy checkout itself (no _site/: the branch is the built site)
    root /var/www/lod-am.net;
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
cd /var/www/lod-am.net && sudo -u www-data git fetch --depth 20 origin deploy && git log --oneline FETCH_HEAD
sudo -u www-data git reset --hard <commit>   # temporary: the next deployment overwrites it
```
For a lasting rollback, revert the change on `main`; the workflow deploys the result.

Back to the old server-side build (as long as `/var/www/lod-am-website` exists): copy
`/opt/deploy-lod-am-main.sh.bak` back to `/opt/deploy-lod-am.sh`, set the nginx `root` to
`/var/www/lod-am-website/_site` and `sudo nginx -t && sudo systemctl reload nginx`.

## Redeploy without a change

GitHub → Actions → **build** → *Run workflow* (on `main`).
