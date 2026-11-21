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
- `vocab/`: copied unchanged from `LOD-AM/knowledge-graph` (commit a151281 for `topics.ttl` and `wikidata.tsv`, otherwise a63f587):
  `data/vocab/*.ttl` (local concepts such as `:not_detected`; `topics.ttl` = the blog's topics) and `tools/chebi.tsv`,
  `tools/wikidata.tsv` (verified element and nuclide ids). Copy again when they change there.
- AAT labels for the pages: `_data/aatLabels.json` (`node scripts/aat_labels.mjs` adds missing ones).

## Adding a released publication
1. Owner's OK; ingest `docs/decisions.md` lists it (later the database's `literature.released_on`, planning#27),
   and the pipeline's release list (`config/released-publications.txt` until then) contains it.
2. A pipeline run (`make release`, on the data LXC; see the pipeline's README) puts it into
   `out/release/published/<citation-key>.ttl`.
3. Copy that file here into `published/`, run
   `NODE_USE_ENV_PROXY=1 node scripts/aat_labels.mjs`, build and `npm run check` (every record needs its page).
4. Add an entry to `_data/dataReleases.js` (date, citation key, what changed). That file is the data changelog
   on `/data/`, and `npm run check` fails without the entry. Record corrections to released data there too.
5. The site maps are cut from one map of the whole research-database area (`EXTENT` in
   `scripts/map/build_maps.py`, 21–62° E, 30–53° N), so new sites need no new map. Only if the database grows beyond that
   box: widen `EXTENT`, `pip install -r scripts/map/requirements.txt`, `python3 scripts/map/build_maps.py` (~2–10 min;
   needs copernicus-dem-90m.s3.amazonaws.com, data.hydrosheds.org, raw.githubusercontent.com). `npm run check` fails for a
   released site outside the box.
