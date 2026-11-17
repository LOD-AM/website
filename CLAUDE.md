# CLAUDE.md: LOD-AM website

Eleventy 3 + Bootstrap 5 site and blog for lod-am.net, self-hosted on the
owner's own server. The blog is the owner's first-person research diary about
building LOD-AM.

## Commands (Node 22, see `.nvmrc`)
```bash
npm ci
npm start        # dev server on http://localhost:8080 (drafts shown)
npm run build    # production build to _site/ (drafts excluded)
npm run check    # checks on _site/: required files, posts vs drafts, internal links
```
Both must pass before a PR (CI `build.yml` runs them). Eleventy doesn't clean
`_site/`, so stale files can make `check` fail locally: build into a fresh folder
instead (`npx @11ty/eleventy --output=/tmp/site-x && node scripts/check_build.mjs /tmp/site-x`).

**Browser checks** (Playwright; preinstalled in Claude cloud sessions):
```bash
npm run qa                                  # = node scripts/qa.mjs all _site
node scripts/qa.mjs audit|overflow|thirdparty [siteDir]
node scripts/qa.mjs screenshots <outDir> [siteDir]   # before/after: build both
python3 scripts/qa-pixdiff.py <beforeDir> <afterDir> [diffDir]
```
`audit` = WCAG AA contrast + headings on the key page types; `overflow` = 375 px
phone; `thirdparty` = no requests to other hosts on load + Giscus only after the
click. Run `npm run qa` for any template/CSS change, and attach the screenshot
comparison to visual changes (images go to the owner in chat; PRs can't hold them).

**Deployment** ([docs/deployment.md](docs/deployment.md)): every push to `main`
is built in CI and, only if build and check pass, pushed to the `deploy` branch.
The owner's web server (Nginx Proxy Manager → Caddy serving static files, in an
LXC on Proxmox) pulls `deploy` via webhook and serves it. **Until website#11 is
done, the server still pulls `main` and builds itself**, so verify live changes
on the `deploy` branch (`git show origin/deploy:<path>`). Never edit
`deploy` by hand; changes reach the site only through `main`. Server-side
changes (webhook, web server config) are the owner's.
The build fetches external URLs (link previews, DOI titles via Crossref,
remote images). Network errors there are warnings, not build failures.

## Layout
- `content/`: input dir. `content/blog/*.md` posts; `about.md`, `impressum.md`, `privacy.md`
- `_includes/layouts/`: `base.njk`, `home.njk`, `post.njk` (post page incl. Giscus comments)
- `_data/metadata.js`: site title/url/author; `_data/tagColors.js`: tag colours; `_data/series.js`: blog series
- **LOD-AM data** (website#18): `data/published/*.ttl` (publications the owner released, exported
  from ingest), `data/vocab/` (copied from knowledge-graph); see `data/README.md`. `_data/lodam.js`
  reads them (n3) and builds one view per record; pages: `content/id/entity.njk` (`/id/<kind>/<uuid>/`),
  `content/data/` (overview, lists, publications). Nothing on these pages may be computed from the data
  (values as reported); `npm run check` fails if a record has no page.
- `_config/filters.js`: date/tag filters; `_config/shortcodes.js`: shortcodes + cached fetches;
  `eleventy.config.js`: plugins and build settings
- `css/theme.css`: the only stylesheet besides Bootstrap. `<html data-bs-theme="dark">` +
  LOD-AM palette as variables; style components via Bootstrap's component variables, not
  `!important`. Terracotta is the accent for the navbar, links and the main action only;
  long texts sit in `.reading-column` (~70 characters per line). `public/`: static files copied as-is

## Blog posts
Front matter:
```yaml
---
title: The Infrastructure - A Homelab for LOD-AM
description: One sentence for lists and social previews.
date: 2026-06-28
tags: ["concept", "infrastructure"]   # lower case, reuse existing tags
draft: true                           # optional; drafts are left out of builds
---
```
Series: `_data/series.js` lists the posts of a series by file name (no front matter needed);
posts get "Part n of m", Home and Blog a "Start here" box. Add new posts of the series there.
Every post page carries schema.org `BlogPosting` JSON-LD (built in `_config/filters.js`,
author profiles in `_data/metadata.js` → `sameAs`); `npm run check` verifies it.
Shortcodes: `{% academicLink "https://doi.org/..." %}` (DOI card, title from Crossref),
`{% linkPreview url %}`, `{% linkPreviewCard url, "title" %}`, `{% icon "house" %}`
(Bootstrap Icons inlined from the npm package; add a label as 2nd argument if the
icon carries meaning). External fetches (link previews, Crossref) are cached in
`.cache/` for 4 weeks via `@11ty/eleventy-fetch`.

## Rules
- **The owner writes the posts.** Their voice, their opinions. If asked to draft,
  set `draft: true` and say what needs their review. Don't publish on their behalf.
- **Published posts are a diary, not documentation.** Don't rewrite them to match
  the current model (e.g. "The ontologies" mentions FRBRoo, which was later
  replaced by FaBiO). If something is wrong now, propose a dated *Update:* note or a new post.
- **Don't change the `title` of a published post**: Giscus maps comment threads by title.
- `impressum.md` and `privacy.md` are German legal documents. Change them only on explicit request.
- Technical claims about the data model must match knowledge-graph `CONVENTIONS.md`.
- Keep the dark, earthy theme (`css/theme.css`, `_data/tagColors.js`).
  Check layout changes in a browser at phone and desktop width.
- **Accessibility:** text must reach WCAG AA contrast (4.5:1, large text 3:1), one
  `<h1>` per page, no skipped heading levels. Tags are outlined chips with a
  coloured dot: new tag colours need 3:1 on page and card background (`_data/tagColors.js`).
- **No third-party requests on page load** (privacy): no CDNs, no remote fonts or
  icons, no embeds that load by themselves. Giscus loads only after the visitor
  clicks "Load comments". Anything new that contacts another server needs the
  owner's OK and a line in `privacy.md` (which only the owner edits).
- Never write `{%` or `{{` in files under `css/`, not even in comments: CSS that
  gets included through Nunjucks (e.g. `prism-diff.css` in `post.njk`) breaks the build.

## Where to resume (state 2026-11-17)
- Phases 1–3 of the improvement plan are done (#22–#24); privacy policy and
  Impressum updated (#27).
- The data model is finished (knowledge-graph#23); issues updated, label `waiting-for-kg` dropped.
- Phase 4 (#12; #14–#17): series navigation and JSON-LD done (#15, #16); open: ORCID (optional),
  which posts get *Update:* notes (#17); #30 postponed.
- Phase 5 (#13; #18–#21): entity pages for the first released publication (hauptmann2002chemical,
  owner 2026-11-17) and the Data menu are built. Further publications only with the owner's OK
  (`data/README.md`). Open: RDF per entity + content negotiation (#19), Data page text and
  example queries (#20), automatic rebuilds (#21, postponed).
- Owner-side: #11 (switch the server to `deploy`, block `.git` in Caddy).
- Open Dependabot PRs and 9 pre-existing `npm audit` findings (e.g. `zod`).
- Before a public SPARQL endpoint or anything that contacts another server:
  update `privacy.md` with the owner (it covers lod-am.net only).

## LOD-AM project (shared block: keep identical in every repo)
Source of truth: knowledge-graph `CLAUDE.md`. Edit it there first, then copy it unchanged; CI (`scripts/check_shared_block.sh`) fails on drift.
LOD-AM = Linked Open Data for Ancient Metallurgy, a one-person research project (https://lod-am.net).
- `LOD-AM/knowledge-graph`: data model, vocabularies, converters, data. **Authority for all modelling rules** (`CONVENTIONS.md`).
- `LOD-AM/triplestore`: Apache Jena Fuseki (Docker) that serves the knowledge graph.
- `LOD-AM/ingest` (**private**): the owner's research database (dump), converter (R2RML) and its output; the database as a whole stays private until the owner says otherwise.
- `LOD-AM/website`: Eleventy site and blog, self-hosted.
- `LOD-AM/ontologies`, `vocabularies`, `converter`: **superseded** by knowledge-graph; don't edit.

Rules for every repo:
- Base IRI `https://lod-am.net/id/`; CIDOC CRM **7.1.3**. Don't restate modelling rules elsewhere; link to knowledge-graph `CONVENTIONS.md`.
- Work on a branch and open a PR to `main`; never push to `main`. Create issues, PRs or comments only when asked.
- Domain/modelling decisions belong to the owner: raise them as knowledge-graph issues (label `modelling`) instead of deciding silently.
- Never commit secrets (passwords, SMTP credentials, `.env`, `shiro.ini`).
- English for code, docs and commits. Keep commits small and explain *why*.
- Verify before you claim: run the repo's checks and report what you ran.
- Open work lives in each repo's GitHub issues; each CLAUDE.md has a "Where to resume"
  section. The owner merges PRs; after a merge, start new work from the updated `main`.
