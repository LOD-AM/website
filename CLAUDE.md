# CLAUDE.md: LOD-AM website

Eleventy 3 + Bootstrap 5 site and blog for lod-am.net, self-hosted on the
owner's own server. The blog is the owner's first-person research diary about
building LOD-AM.

## Commands (Node 22, see `.nvmrc`)
```bash
npm ci
npm start        # dev server on http://localhost:8080 (drafts shown)
npm run build    # production build to _site/ (drafts excluded). Must succeed before a PR
```
`build-ghpages`/`start-ghpages` are leftovers from the eleventy-base-blog starter
(wrong path prefix). Don't use them. Deployment to the server is done by the
owner; ask how before changing anything deployment-related.
The build fetches external URLs (link previews, DOI titles via Crossref,
remote images). Network errors there are warnings, not build failures.

## Layout
- `content/`: input dir. `content/blog/*.md` posts; `about.md`, `impressum.md`, `privacy.md`
- `_includes/layouts/`: `base.njk`, `home.njk`, `post.njk` (post page incl. Giscus comments)
- `_data/metadata.js`: site title/url/author; `_data/tagColors.js`: tag colours
- `_config/filters.js`: date/tag filters; `eleventy.config.js`: plugins and shortcodes
- `css/bootstrap-theme.css`: theme colours; `public/`: static files copied as-is

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
Shortcodes: `{% academicLink "https://doi.org/..." %}` (DOI card, title from Crossref),
`{% linkPreview url %}`, `{% linkPreviewCard url, "title" %}`.

## Rules
- **The owner writes the posts.** Their voice, their opinions. If asked to draft,
  set `draft: true` and say what needs their review. Don't publish on their behalf.
- **Published posts are a diary, not documentation.** Don't rewrite them to match
  the current model (e.g. "The ontologies" mentions FRBRoo, which was later
  replaced by FaBiO). If something is wrong now, propose a dated *Update:* note or a new post.
- **Don't change the `title` of a published post**: Giscus maps comment threads by title.
- `impressum.md` and `privacy.md` are German legal documents. Change them only on explicit request.
- Technical claims about the data model must match knowledge-graph `CONVENTIONS.md`.
- Keep the dark, earthy theme (`css/bootstrap-theme.css`, `_data/tagColors.js`).
  Check layout changes in a browser at phone and desktop width.

## LOD-AM project (shared block: keep identical in every repo)
Source of truth: knowledge-graph `CLAUDE.md`. Edit it there first, then copy it unchanged; CI (`scripts/check_shared_block.sh`) fails on drift.
LOD-AM = Linked Open Data for Ancient Metallurgy, a one-person research project (https://lod-am.net).
- `LOD-AM/knowledge-graph`: data model, vocabularies, converters, data. **Authority for all modelling rules** (`CONVENTIONS.md`).
- `LOD-AM/triplestore`: Apache Jena Fuseki (Docker) that serves the knowledge graph.
- `LOD-AM/website`: Eleventy site and blog, self-hosted.
- `LOD-AM/ontologies`, `vocabularies`, `converter`: **superseded** by knowledge-graph; don't edit.

Rules for every repo:
- Base IRI `https://lod-am.net/id/`; CIDOC CRM **7.1.3**. Don't restate modelling rules elsewhere; link to knowledge-graph `CONVENTIONS.md`.
- Work on a branch and open a PR to `main`; never push to `main`. Create issues, PRs or comments only when asked.
- Domain/modelling decisions belong to the owner: raise them as knowledge-graph issues (label `modelling`) instead of deciding silently.
- Never commit secrets (passwords, SMTP credentials, `.env`, `shiro.ini`).
- English for code, docs and commits. Keep commits small and explain *why*.
- Verify before you claim: run the repo's checks and report what you ran.
