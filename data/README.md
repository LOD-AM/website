# LOD-AM data on the website

Source of the entity pages `/id/<kind>/<uuid>/` and the Data pages (website#18).

- `published/<citation-key>.ttl`: the records of one publication the owner **released**
  for the website, exported by the `publish` stage of [`LOD-AM/pipeline`](https://github.com/LOD-AM/pipeline)
  (`scripts/export_publication.py`; only that publication's finds and
  analyses and what they point to; checked with knowledge-graph's term check and SHACL). It also
  carries the bibliographic records of the publications its chronology systems cite (`dcterms:source`);
  those get a publication page marked "cited as a source", without data.
  Served for download at `/data/<citation-key>.ttl`. Licence: CC BY 4.0.
  Never put anything else from the pipeline's output here (only `out/release/published/`): the database as a
  whole stays private.
- `release-manifest.json`: the manifest of the release the files come from (pipeline and knowledge-graph
  commits, sha256 per file; no figures about the full database). Written by the automatic hand-over below.
- `vocab/`: copied unchanged from `LOD-AM/knowledge-graph` (commit a151281 for `topics.ttl` and `wikidata.tsv`, otherwise a63f587):
  `data/vocab/*.ttl` (local concepts such as `:not_detected`; `topics.ttl` = the blog's topics) and `tools/chebi.tsv`,
  `tools/wikidata.tsv` (verified element and nuclide ids). Copy again when they change there.
- AAT labels for the pages: `_data/aatLabels.json` (`node scripts/aat_labels.mjs` adds missing ones).

## Automatic updates (website#21)
When a release goes live in the triplestore, its `scripts/publish_website.sh` (LOD-AM/triplestore) pushes
the release's files to the branch `data-release`: `published/*.ttl` exactly as released (a publication no
longer released is removed) and `release-manifest.json`. The workflow `.github/workflows/data-release.yml`
then checks that the push changes nothing else and that every file matches the manifest
(`scripts/data_release.mjs verify`), fetches missing AAT labels, adds an entry to `_data/dataReleases.js`,
opens a pull request "Data release <id>" (or updates the open one) and starts `build.yml` on the branch.
**The owner reviews and merges it**: rewrite the changelog text (it is shown on `/data/`), check the
triple changes listed in the pull request; merging deploys the pages. Setup: triplestore README "Website".

## Adding a released publication
1. Owner's OK; ingest `docs/decisions.md` lists it (later the database's `literature.released_on`, planning#27),
   and the pipeline's release list (`config/released-publications.txt` until then) contains it.
2. A pipeline run (`make release`, on the data LXC; see the pipeline's README) puts it into
   `out/release/published/<citation-key>.ttl`.
3. Once the release is live in the triplestore, the pull request "Data release …" arrives (above). By hand
   instead: copy the file here into `published/`, run `NODE_USE_ENV_PROXY=1 node scripts/aat_labels.mjs`,
   build and `npm run check` (every record needs its page).
4. The entry in `_data/dataReleases.js` (date, citation key, what changed) is the data changelog on `/data/`;
   `npm run check` fails without it. The pull request adds one; write its text. Record corrections there too.
5. The site maps are cut from one map of the whole research-database area (`EXTENT` in
   `scripts/map/build_maps.py`, 21–62° E, 30–53° N), so new sites need no new map. Only if the database grows beyond that
   box: widen `EXTENT`, `pip install -r scripts/map/requirements.txt`, `python3 scripts/map/build_maps.py` (~2–10 min;
   needs copernicus-dem-90m.s3.amazonaws.com, data.hydrosheds.org, raw.githubusercontent.com). `npm run check` fails for a
   released site outside the box.
