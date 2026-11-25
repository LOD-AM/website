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
| Old setup (rollback, until the owner removes it) | `/var/www/lod-am-website` (main checkout, built on the server), script `/opt/deploy-lod-am-main.sh.bak` |

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
cd /var/www/lod-am.net && sudo -u www-data git fetch --depth 20 origin deploy && git log --oneline FETCH_HEAD
sudo -u www-data git reset --hard <commit>   # temporary: the next deployment overwrites it
```
For a lasting rollback, revert the change on `main`; the workflow deploys the result.

Back to the old server-side build (only as long as `/var/www/lod-am-website` exists): copy
`/opt/deploy-lod-am-main.sh.bak` back to `/opt/deploy-lod-am.sh`, set the nginx `root` to
`/var/www/lod-am-website/_site` and `sudo nginx -t && sudo systemctl reload nginx`.

## Redeploy without a change

GitHub → Actions → **build** → *Run workflow* (on `main`).
