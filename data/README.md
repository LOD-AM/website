# LOD-AM data on the website

Source of the entity pages `/id/<kind>/<uuid>/` and the Data pages (website#18).

- `published/<citation-key>.ttl`: the records of one publication the owner **released**
  for the website, exported from the private `LOD-AM/ingest` with
  `scripts/export_publication.sh <citation-key>` (only that publication's finds and
  analyses and what they point to; checked with knowledge-graph's term check and SHACL).
  Served for download at `/data/<citation-key>.ttl`. Licence: CC BY 4.0.
  Never put anything else from ingest here: the database as a whole stays private.
- `vocab/`: copied unchanged from `LOD-AM/knowledge-graph` (commit a151281 for `topics.ttl` and `wikidata.tsv`, otherwise a63f587):
  `data/vocab/*.ttl` (local concepts such as `:not_detected`; `topics.ttl` = the blog's topics) and `tools/chebi.tsv`,
  `tools/wikidata.tsv` (verified element and nuclide ids). Copy again when they change there.
- AAT labels for the pages: `_data/aatLabels.json` (`node scripts/aat_labels.mjs` adds missing ones).

## Adding a released publication
1. Owner's OK; ingest `docs/decisions.md` lists it.
2. In ingest: `scripts/materialize.sh`, then `scripts/export_publication.sh <citation-key>`.
3. Copy `out/published/<citation-key>.ttl` here into `published/`, run
   `NODE_USE_ENV_PROXY=1 node scripts/aat_labels.mjs`, build and `npm run check` (every record needs its page).
