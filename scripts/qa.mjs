// Browser checks on the built site (headless Chromium via Playwright).
//
//   node scripts/qa.mjs [audit|overflow|thirdparty|all] [siteDir]   (default: all, _site)
//   node scripts/qa.mjs screenshots <outDir> [siteDir]
//
// audit       WCAG AA contrast of every visible text element (4.5:1, large
//             text 3:1), one <h1> per page, no skipped heading levels, images
//             without alt, buttons without a name. Key page types.
// overflow    horizontal overflow on a 375 px phone, all pages
// thirdparty  requests to other hosts on page load (all pages), and that
//             Giscus loads only after "Load comments" with the expected settings
// screenshots full-page PNGs of the key page types, desktop + phone, for
//             before/after comparison with scripts/qa-pixdiff.py
//
// Third-party requests are blocked (offline-safe). Remote images in posts
// (opengraph.githubassets.com) only show up locally: CI downloads them during
// the build and serves them from the site.
//
// Playwright isn't a dependency of this repo. It's preinstalled in Claude Code
// cloud sessions. Locally: npm i --no-save playwright && npx playwright install chromium
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url); // honours NODE_PATH (global installs)
let chromium, devices;
try {
  ({ chromium, devices } = require("playwright"));
} catch {
  console.error("Playwright not found. Install: npm i --no-save playwright && npx playwright install chromium");
  process.exit(2);
}

const KEY_PAGES = {
  home: "/", blog: "/blog/", post: "/blog/The_first_example/", about: "/about/",
  tags: "/tags/", tag: "/tags/concept/", notfound: "/404.html", impressum: "/impressum/", privacy: "/privacy/",
};
const GISCUS_EXPECTED = { repo: "lod-am/website", category: "Comments", mapping: "title" };
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon", ".xml": "application/xml" };

function serve(site) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = path.join(site, decodeURIComponent(req.url.split("?")[0]));
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
      if (!fs.existsSync(p)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    }).listen(0, () => resolve({ srv, base: `http://localhost:${srv.address().port}` }));
  });
}

function allPages(site) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d)) {
      const p = path.join(d, e);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (e.endsWith(".html")) out.push("/" + path.relative(site, p).replace(/index\.html$/, ""));
    }
  })(site);
  return out.sort();
}

async function newPage(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
  return page;
}

async function audit(browser, base) {
  const page = await newPage(browser, { viewport: { width: 1366, height: 900 } });
  let failed = 0;
  for (const url of Object.values(KEY_PAGES)) {
    await page.goto(base + url, { waitUntil: "load" });
    const r = await page.evaluate(() => {
      const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
      const bgOf = (el) => {
        const layers = [];
        for (let e = el; e; e = e.parentElement) {
          const cs = getComputedStyle(e);
          if (cs.backgroundImage.includes("gradient")) { const m = cs.backgroundImage.match(/rgba?\([^)]+\)/g); if (m) layers.push(parse(m[m.length - 1])); break; }
          const c = parse(cs.backgroundColor); if (c.a > 0) { layers.push(c); if (c.a === 1) break; }
        }
        let bg = { r: 255, g: 255, b: 255, a: 1 }; for (const l of layers.reverse()) bg = blend(l, bg); return bg;
      };
      const fails = [];
      for (const el of document.querySelectorAll("body *")) {
        if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
        const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
        if (!text) continue;
        const cs = getComputedStyle(el); const bg = bgOf(el); const fg = blend(parse(cs.color), bg);
        const a = lum(fg), b = lum(bg); const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
        const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
        if (ratio < need) fails.push(`contrast ${ratio.toFixed(2)} < ${need}: <${el.tagName.toLowerCase()}> "${text.slice(0, 40)}"`);
      }
      const h = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((x) => +x.tagName[1]);
      if (h.filter((l) => l === 1).length !== 1) fails.push(`${h.filter((l) => l === 1).length} <h1> elements`);
      h.forEach((l, i) => { if (i > 0 && l > h[i - 1] + 1) fails.push(`heading level skipped: h${h[i - 1]} -> h${l}`); });
      document.querySelectorAll("img:not([alt])").forEach((i) => fails.push(`img without alt: ${i.getAttribute("src")}`));
      [...document.querySelectorAll("button")].filter((x) => !x.textContent.trim() && !x.getAttribute("aria-label")).forEach(() => fails.push("button without a name"));
      return [...new Set(fails)];
    });
    console.log(`${r.length ? "FAIL" : "ok  "} audit ${url}`);
    r.slice(0, 10).forEach((f) => console.log(`       ${f}`));
    failed += r.length ? 1 : 0;
  }
  return failed;
}

async function overflow(browser, base, site) {
  const page = await newPage(browser, devices["iPhone SE"]);
  let failed = 0;
  for (const u of allPages(site)) {
    await page.goto(base + encodeURI(u), { waitUntil: "load" });
    const [w, vw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (w > vw) { failed++; console.log(`FAIL overflow ${u}: ${w}px > ${vw}px`); }
  }
  console.log(`${failed ? "FAIL" : "ok  "} overflow: ${allPages(site).length} pages at 375 px`);
  return failed;
}

async function thirdparty(browser, base, site) {
  const page = await newPage(browser, { viewport: { width: 1366, height: 900 } });
  let hosts = new Set(); const errors = [];
  page.on("request", (r) => { const h = new URL(r.url()).hostname; if (h !== "localhost") hosts.add(h); });
  page.on("pageerror", (e) => errors.push(e.message));
  const seen = {};
  for (const u of allPages(site)) {
    hosts = new Set();
    await page.goto(base + encodeURI(u), { waitUntil: "networkidle" });
    for (const h of hosts) (seen[h] ||= []).push(u);
  }
  let failed = 0;
  for (const [h, us] of Object.entries(seen)) {
    const localOnly = h === "opengraph.githubassets.com"; // downloaded by CI during the build
    if (!localOnly) failed++;
    console.log(`${localOnly ? "note" : "FAIL"} ${h} requested on load: ${us.length} page(s), e.g. ${us.slice(0, 3).join(" ")}`);
  }
  if (!Object.keys(seen).length) console.log("ok   no third-party requests on load");
  // Giscus: nothing before the click, expected settings after
  hosts = new Set();
  await page.goto(base + KEY_PAGES.post, { waitUntil: "networkidle" });
  const before = [...hosts].filter((h) => h.includes("giscus"));
  await page.click("#load-comments");
  await page.waitForTimeout(500);
  const data = await page.evaluate(() => { const s = document.querySelector('script[src*="giscus.app"]'); return s ? { ...s.dataset } : null; });
  const ok = !before.length && data && Object.entries(GISCUS_EXPECTED).every(([k, v]) => data[k] === v) && !errors.length;
  console.log(`${ok ? "ok  " : "FAIL"} giscus: before click ${before.length ? "LOADED" : "nothing"}; after click ${data ? JSON.stringify({ repo: data.repo, category: data.category, mapping: data.mapping }) : "NOT LOADED"}; JS errors: ${errors.length ? errors.join("; ") : "none"}`);
  return failed + (ok ? 0 : 1);
}

async function screenshots(browser, base, out) {
  fs.mkdirSync(out, { recursive: true });
  for (const [view, opts] of [["desktop", { viewport: { width: 1366, height: 900 } }], ["phone", devices["iPhone 13"]]]) {
    const page = await newPage(browser, opts);
    for (const [name, url] of Object.entries(KEY_PAGES)) {
      await page.goto(base + url, { waitUntil: "load" });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(out, `${view}-${name}.png`), fullPage: true });
    }
  }
  console.log(`screenshots written to ${out}`);
  return 0;
}

const [cmd = "all", a1, a2] = process.argv.slice(2);
const site = path.resolve(cmd === "screenshots" ? (a2 || "_site") : (a1 || "_site"));
if (!fs.existsSync(path.join(site, "index.html"))) { console.error(`no built site in ${site} (run npm run build)`); process.exit(2); }
const { srv, base } = await serve(site);
const browser = await chromium.launch();
let failed = 0;
try {
  if (cmd === "screenshots") failed = await screenshots(browser, base, path.resolve(a1 || "qa-screenshots"));
  else {
    if (cmd === "audit" || cmd === "all") failed += await audit(browser, base);
    if (cmd === "overflow" || cmd === "all") failed += await overflow(browser, base, site);
    if (cmd === "thirdparty" || cmd === "all") failed += await thirdparty(browser, base, site);
  }
} finally {
  await browser.close();
  srv.close();
}
process.exit(failed ? 1 : 0);
