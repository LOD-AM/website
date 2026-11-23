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
port 8080. Its config is [`docs/nginx/lod-am.conf`](nginx/lod-am.conf), tested with
`scripts/check_conneg.sh` against a local nginx. It:

- serves the site's own 404 page and never `.git/`;
- serves RDF with its media type: `.ttl` as `text/turtle`, `.jsonld` as `application/ld+json`
  (both readable from other sites' scripts, CORS `*`);
- keeps redirects relative (`absolute_redirect off`). Without it, nginx behind the proxy redirects
  to `http://lod-am.net:8080/…`, which visitors can't reach;
- does **content negotiation for record IRIs** (website#19). `https://lod-am.net/id/<kind>/<uuid>`
  (no trailing slash) names a find, site, analysis …, not a page, so it answers `303 See Other`
  with `Vary: Accept`:

  | Accept | Redirected to |
  |---|---|
  | `text/turtle` | `/id/<kind>/<uuid>.ttl` |
  | `application/ld+json` | `/id/<kind>/<uuid>.jsonld` |
  | anything else (browsers) | `/id/<kind>/<uuid>/` (the page) |

Apply (keep your own `root` line; the file's `map` must sit inside `http { }`, which is the
case for files in `sites-enabled/` on Debian/Ubuntu):
```bash
sudo cp /etc/nginx/sites-available/lod-am /etc/nginx/sites-available/lod-am.bak
sudo nano /etc/nginx/sites-available/lod-am      # take over docs/nginx/lod-am.conf, keep your root
sudo nginx -t && sudo systemctl reload nginx
```
Check from anywhere (only reads; every line should say `ok`):
```bash
scripts/check_conneg.sh
```
By hand:
```bash
curl -sI -H 'Accept: text/turtle' https://lod-am.net/id/find/8617989c-e99b-4e81-8b57-e707b8dc85c5   # 303, Location: ….ttl
```
Rollback: `sudo cp /etc/nginx/sites-available/lod-am.bak /etc/nginx/sites-available/lod-am && sudo nginx -t && sudo systemctl reload nginx`.

## Rollback

Every deployment is one commit on `deploy`. To go back on the server:
```bash
cd /srv/www/lod-am.net && git fetch --depth 20 origin deploy && git log --oneline origin/deploy
git reset --hard <commit>      # temporary: the next deployment overwrites it
```
For a lasting rollback, revert the change on `main`; the workflow deploys the result.

## Redeploy without a change

GitHub → Actions → **build** → *Run workflow* (on `main`).
