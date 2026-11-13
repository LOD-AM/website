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

3. **Don't serve `.git/`.** The checkout contains a `.git` directory. Block it, e.g. for nginx:
   ```nginx
   location ~ /\.git { deny all; return 404; }
   ```
   For Caddy: `@git path /.git/*` + `respond @git 404`.

4. The old server-side build (`npm ci && npx @11ty/eleventy`) can be removed once the webhook serves the `deploy` branch.

## Rollback

Every deployment is one commit on `deploy`. To go back on the server:
```bash
cd /srv/www/lod-am.net && git fetch --depth 20 origin deploy && git log --oneline origin/deploy
git reset --hard <commit>      # temporary: the next deployment overwrites it
```
For a lasting rollback, revert the change on `main`; the workflow deploys the result.

## Redeploy without a change

GitHub → Actions → **build** → *Run workflow* (on `main`).
