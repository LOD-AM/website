// Sanity checks on the built site in _site/ (run after `npm run build`).
// Optional argument: another output folder, e.g. node scripts/check_build.mjs /tmp/site
// - required files exist
// - every non-draft post in content/blog/ has a page, drafts have none
// - internal links and assets (href/src starting with "/") resolve
// - every post page has parseable schema.org JSON-LD (BlogPosting), the home page WebSite
// - every LOD-AM record in data/published/*.ttl (/id/<kind>/<uuid>) has its page, and the
//   released files are downloadable under /data/
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
    }
  }
}

if (errors.length) {
  console.error(`Build check FAILED (${errors.length}):\n- ` + [...new Set(errors)].join("\n- "));
  process.exit(1);
}
console.log(`Build check ok: ${posts} posts, ${records} LOD-AM records with pages, ${links} internal links/assets checked`);
