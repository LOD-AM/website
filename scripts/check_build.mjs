// Sanity checks on the built site in _site/ (run after `npm run build`).
// Optional argument: another output folder, e.g. node scripts/check_build.mjs /tmp/site
// - required files exist
// - every non-draft post in content/blog/ has a page, drafts have none
// - internal links and assets (href/src starting with "/") resolve
// - every post page has parseable schema.org JSON-LD (BlogPosting), the home page WebSite
// - every LOD-AM record in data/published/*.ttl (/id/<kind>/<uuid>) has its page, and the
//   released files are downloadable under /data/
// - the search index (Pagefind, planning#17) exists and holds every post and record page
import { Parser } from "n3";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const SITE = process.argv[2] || "_site";
const errors = [];

for (const f of ["index.html", "404.html", "feed/feed.xml", "sitemap.xml", "robots.txt", "blog/index.html"]) {
  if (!existsSync(join(SITE, f))) errors.push(`missing ${f}`);
}

// schema.org JSON-LD: present, parseable, of the expected type
function checkJsonLd(file, type) {
  const blocks = [...readFileSync(file, "utf8").matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) return errors.push(`${file}: no JSON-LD`);
  for (const [, json] of blocks) {
    let data;
    try { data = JSON.parse(json); } catch (e) { errors.push(`${file}: JSON-LD doesn't parse (${e.message})`); continue; }
    const types = (data["@graph"] || [data]).map((x) => x["@type"]);
    if (!types.includes(type)) errors.push(`${file}: JSON-LD has no ${type}`);
  }
}
if (existsSync(join(SITE, "index.html"))) checkJsonLd(join(SITE, "index.html"), "WebSite");

const postsDir = "content/blog";
let posts = 0;
for (const f of readdirSync(postsDir).filter((f) => extname(f) === ".md")) {
  const fm = (readFileSync(join(postsDir, f), "utf8").match(/^---\n([\s\S]*?)\n---/) || [, ""])[1];
  if (/^permalink:/m.test(fm)) continue;
  const page = join(SITE, "blog", basename(f, ".md"), "index.html");
  const draft = /^draft:\s*true\s*$/m.test(fm);
  if (draft && existsSync(page)) errors.push(`draft is published: ${f}`);
  if (!draft && !existsSync(page)) errors.push(`post has no page: ${f}`);
  if (!draft && existsSync(page)) checkJsonLd(page, "BlogPosting");
  if (!draft) posts++;
}

function* htmlFiles(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (p.endsWith(".html")) yield p;
  }
}

let links = 0;
for (const file of htmlFiles(SITE)) {
  const html = readFileSync(file, "utf8");
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    if (url.startsWith("//")) continue; // protocol-relative = external
    links++;
    let path;
    try { path = decodeURIComponent(url); } catch { errors.push(`${file}: bad URL ${url}`); continue; }
    const target = join(SITE, path);
    const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, "index.html")));
    if (!ok) errors.push(`${file}: broken internal link ${url}`);
  }
}

// Triples of a record in a released file: the record and its helper nodes (<record>/...)
const parsed = new Map();
function ownCount(file, iri) {
  if (!parsed.has(file)) parsed.set(file, new Parser().parse(readFileSync(join("data/published", file), "utf8")));
  return parsed.get(file).filter((q) => q.subject.value === iri || q.subject.value.startsWith(iri + "/")).length;
}

// Entity pages (website#18)
let records = 0;
const KINDS = ["site", "feature", "find", "analysis", "type", "period", "culture", "chronology", "region", "lab", "person", "journal"];
if (existsSync("data/published")) {
  for (const f of readdirSync("data/published").filter((f) => f.endsWith(".ttl"))) {
    if (!existsSync(join(SITE, "data", f))) errors.push(`released data not downloadable: /data/${f}`);
    // records, and the records behind helper nodes (<record>/<role>, e.g. a site's place)
    const ids = new Set((readFileSync(join("data/published", f), "utf8").match(/https:\/\/lod-am\.net\/id\/[a-z]+\/[0-9a-f-]{36}/g) || []));
    for (const iri of ids) {
      const [kind, uuid] = iri.slice("https://lod-am.net/id/".length).split("/");
      if (!KINDS.includes(kind)) continue;
      records++;
      if (!existsSync(join(SITE, "id", kind, uuid, "index.html"))) errors.push(`no page for ${iri}`);
      // Per-record downloads (planning#13): exist, parse, and hold the record's own triples
      const base = join(SITE, "id", kind, uuid);
      if (!existsSync(base + ".ttl") || !existsSync(base + ".jsonld")) { errors.push(`no Turtle/JSON-LD download for ${iri}`); continue; }
      try {
        const n = new Parser().parse(readFileSync(base + ".ttl", "utf8")).length;
        const own = ownCount(f, iri);
        if (n !== own) errors.push(`${iri}.ttl: ${n} triples, expected ${own}`);
        const doc = JSON.parse(readFileSync(base + ".jsonld", "utf8"));
        if (!doc["@graph"]?.some((x) => x["@id"] === iri)) errors.push(`${iri}.jsonld: record node missing`);
      } catch (e) { errors.push(`${iri}: download does not parse (${e.message})`); }
    }
  }
}

// Data page (planning#15): every released file is in the data changelog, and the
// schema.org Dataset is valid JSON naming every download
{
  const { default: releases } = await import(new URL("../_data/dataReleases.js", import.meta.url));
  const released = new Set(releases.flatMap((r) => r.publications));
  for (const f of existsSync("data/published") ? readdirSync("data/published").filter((f) => f.endsWith(".ttl")) : []) {
    if (!released.has(f.replace(/\.ttl$/, ""))) errors.push(`data/published/${f} has no entry in _data/dataReleases.js`);
  }
  const html = readFileSync(join(SITE, "data", "index.html"), "utf8");
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try {
    const ds = JSON.parse(m[1]);
    if (ds["@type"] !== "Dataset" || !ds.name || !ds.description || !ds.license) errors.push("/data/: Dataset JSON-LD lacks @type, name, description or license");
    for (const f of readdirSync("data/published").filter((f) => f.endsWith(".ttl")))
      if (!ds.distribution?.some((d) => d.contentUrl.endsWith(`/data/${f}`))) errors.push(`/data/: Dataset JSON-LD has no distribution for ${f}`);
  } catch (e) { errors.push(`/data/: no valid Dataset JSON-LD (${e.message})`); }
}

// Site maps (planning#18): every released site lies inside the map area, and its page shows the
// map with the site highlighted. A site outside the
// area: widen EXTENT in scripts/map/build_maps.py and run it again.
{
  const m = existsSync("_data/siteMaps.json") ? JSON.parse(readFileSync("_data/siteMaps.json", "utf8")) : null;
  if (m && !existsSync(join(SITE, m.overview.src))) errors.push(`map overview missing: ${m.overview.src}`);
  for (const f of existsSync("data/published") ? readdirSync("data/published").filter((f) => f.endsWith(".ttl")) : []) {
    const text = readFileSync(join("data/published", f), "utf8");
    for (const g of text.matchAll(/<https:\/\/lod-am\.net\/id\/site\/([0-9a-f-]{36})\/geometry>[^.]*?asWKT\s+"POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)"/gs)) {
      const [lon, lat] = [Number(g[2]), Number(g[3])];
      const e = m?.extent;
      if (!e || lon < e.west || lon > e.east || lat < e.south || lat > e.north)
        errors.push(`site ${g[1]} (${lat} N, ${lon} E) is outside the map area: widen EXTENT in scripts/map/build_maps.py`);
      const page = join(SITE, "id", "site", g[1], "index.html");
      if (existsSync(page) && !readFileSync(page, "utf8").includes('site-map__marker site-map__marker--current')) errors.push(`site page ${g[1]} shows no map`);
    }
  }
}

// Site search (planning#17): Pagefind's index, with every post and record page in it
let indexed = 0;
{
  const entry = join(SITE, "pagefind", "pagefind-entry.json");
  if (!existsSync(entry) || !existsSync(join(SITE, "pagefind", "pagefind-ui.js"))) errors.push("search index missing: pagefind/ (built by the eleventy.after hook)");
  else {
    indexed = Object.values(JSON.parse(readFileSync(entry, "utf8")).languages).reduce((n, l) => n + l.page_count, 0);
    const pages = new Set();
    for (const kind of existsSync(join(SITE, "id")) ? readdirSync(join(SITE, "id")) : [])
      for (const e of readdirSync(join(SITE, "id", kind))) if (existsSync(join(SITE, "id", kind, e, "index.html"))) pages.add(`${kind}/${e}`);
    if (indexed < posts + pages.size) errors.push(`search index holds ${indexed} pages, expected at least ${posts} posts + ${pages.size} records`);
  }
}

if (errors.length) {
  console.error(`Build check FAILED (${errors.length}):\n- ` + [...new Set(errors)].join("\n- "));
  process.exit(1);
}
console.log(`Build check ok: ${posts} posts, ${records} LOD-AM records with pages, ${links} internal links/assets checked, ${indexed} pages in the search index`);
