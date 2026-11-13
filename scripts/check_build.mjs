// Sanity checks on the built site in _site/ (run after `npm run build`).
// - required files exist
// - every non-draft post in content/blog/ has a page, drafts have none
// - internal links and assets (href/src starting with "/") resolve
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const SITE = "_site";
const errors = [];

for (const f of ["index.html", "404.html", "feed/feed.xml", "sitemap.xml", "robots.txt", "blog/index.html"]) {
  if (!existsSync(join(SITE, f))) errors.push(`missing ${f}`);
}

const postsDir = "content/blog";
let posts = 0;
for (const f of readdirSync(postsDir).filter((f) => extname(f) === ".md")) {
  const fm = (readFileSync(join(postsDir, f), "utf8").match(/^---\n([\s\S]*?)\n---/) || [, ""])[1];
  if (/^permalink:/m.test(fm)) continue;
  const page = join(SITE, "blog", basename(f, ".md"), "index.html");
  const draft = /^draft:\s*true\s*$/m.test(fm);
  if (draft && existsSync(page)) errors.push(`draft is published: ${f}`);
  if (!draft && !existsSync(page)) errors.push(`post has no page: ${f}`);
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

if (errors.length) {
  console.error(`Build check FAILED (${errors.length}):\n- ` + [...new Set(errors)].join("\n- "));
  process.exit(1);
}
console.log(`Build check ok: ${posts} posts, ${links} internal links/assets checked`);
