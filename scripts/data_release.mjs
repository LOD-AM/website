// Data releases from the triplestore (website#21). The triplestore pushes the release it serves to
// the branch `data-release` (LOD-AM/triplestore scripts/publish_website.sh); the workflow
// .github/workflows/data-release.yml runs this script there and opens a pull request for the owner.
//
//   node scripts/data_release.mjs verify <base> <commit>   the commit changes only the release files, and
//                                                          they match data/release-manifest.json
//   node scripts/data_release.mjs changelog <base>         add an entry to _data/dataReleases.js
//   node scripts/data_release.mjs summary <base>           pull request text (Markdown) on stdout
//
// <base> is the website's main the branch was built on (origin/main). Only data/published/*.ttl and
// data/release-manifest.json may come from the triplestore: everything else on the site stays
// reviewed code. The release holds only publications the owner released (LOD-AM/pipeline).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { Parser, Writer } from "n3";

const [cmd, base, commit] = process.argv.slice(2);
const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 28 });
const fail = (msg) => { console.error(`data-release: FAIL ${msg}`); process.exit(1); };
const ALLOWED = /^(data\/published\/[A-Za-z0-9_.-]+\.ttl|data\/release-manifest\.json)$/;
const MANIFEST = "data/release-manifest.json";
if (!base) fail("usage: node scripts/data_release.mjs verify|changelog|summary <base> [<commit>]");

const ttlAt = (rev) => {
  const out = git("ls-tree", "--name-only", `${rev}:data/published`);
  return new Set(out.split("\n").filter((f) => f.endsWith(".ttl")).map((f) => f.replace(/\.ttl$/, "")));
};
const changes = () => { // publications added, updated, removed against <base>
  const before = ttlAt(base), after = new Set(readdirSync("data/published").filter((f) => f.endsWith(".ttl")).map((f) => f.replace(/\.ttl$/, "")));
  const changed = new Set(git("diff", "--name-only", base, "--", "data/published").split("\n").filter(Boolean)
    .map((f) => f.replace(/^data\/published\//, "").replace(/\.ttl$/, "")));
  return {
    added: [...after].filter((k) => !before.has(k)).sort(),
    updated: [...after].filter((k) => before.has(k) && changed.has(k)).sort(),
    removed: [...before].filter((k) => !after.has(k)).sort(),
  };
};
const manifest = () => JSON.parse(readFileSync(MANIFEST, "utf8"));
const releaseId = () => createHash("sha256").update(readFileSync(MANIFEST)).digest("hex").slice(0, 12);

if (cmd === "verify") {
  if (!commit) fail("verify needs <commit>");
  const touched = git("diff", "--name-only", `${base}...${commit}`).split("\n").filter(Boolean);
  const other = touched.filter((f) => !ALLOWED.test(f));
  if (other.length) fail(`the release commit changes files outside the release: ${other.join(", ")}`);
  if (!touched.length) fail("the release commit changes nothing");
  const m = manifest();
  const c = m.checks || {};
  if (c.terms !== "passed" || c.shacl_violations !== 0 || c.test_materialize !== "passed") fail(`checks did not all pass: ${JSON.stringify(c)}`);
  const listed = new Map((m.publications?.files || []).map((p) => [p.file.replace(/^published\//, ""), p.sha256]));
  const present = readdirSync("data/published").filter((f) => f.endsWith(".ttl"));
  for (const f of present) {
    if (!listed.has(f)) fail(`data/published/${f} is not in the release manifest`);
    const sha = createHash("sha256").update(readFileSync(`data/published/${f}`)).digest("hex");
    if (sha !== listed.get(f)) fail(`data/published/${f}: sha256 differs from the release manifest`);
  }
  for (const f of listed.keys()) if (!present.includes(f)) fail(`data/published/${f} is listed in the manifest but missing`);
  console.log(`data-release: ok, ${present.length} publication(s) as in release ${releaseId()}`);
} else if (cmd === "changelog") {
  const { added, updated, removed } = changes();
  const parts = [];
  if (added.length) parts.push(`Added: ${added.join(", ")}.`);
  if (updated.length) parts.push(`Updated: ${updated.join(", ")}.`);
  if (removed.length) parts.push(`Withdrawn: ${removed.join(", ")}.`);
  const entry = {
    date: new Date().toISOString().slice(0, 10),
    publications: [...added, ...updated],
    changes: `Data release ${releaseId()}. ${parts.join(" ")}`,
  };
  const p = "_data/dataReleases.js";
  const src = readFileSync(p, "utf8");
  const anchor = "export default [\n";
  if (!src.includes(anchor)) fail(`${p}: "export default [" not found`);
  const text = `\t{\n\t\tdate: ${JSON.stringify(entry.date)},\n\t\tpublications: ${JSON.stringify(entry.publications)},\n\t\tchanges: ${JSON.stringify(entry.changes)},\n\t},\n`;
  writeFileSync(p, src.replace(anchor, anchor + text));
  console.log(`data-release: changelog entry added: ${entry.changes}`);
} else if (cmd === "summary") {
  const { added, updated, removed } = changes();
  const m = manifest();
  // Triples added/removed per file, for the review (the release has no blank nodes)
  const triples = (text) => new Set(new Parser().parse(text).map((q) => new Writer({ format: "N-Triples" }).quadToString(q.subject, q.predicate, q.object)));
  const rows = [];
  for (const k of [...added, ...updated, ...removed]) {
    const f = `data/published/${k}.ttl`;
    const before = removed.includes(k) || updated.includes(k) ? triples(git("show", `${base}:${f}`)) : new Set();
    const after = existsSync(f) ? triples(readFileSync(f, "utf8")) : new Set();
    const plus = [...after].filter((t) => !before.has(t)).length, minus = [...before].filter((t) => !after.has(t)).length;
    rows.push(`| \`${k}\` | ${added.includes(k) ? "added" : removed.includes(k) ? "withdrawn" : "updated"} | ${after.size} | +${plus} / −${minus} |`);
  }
  const short = (c) => (c ? String(c).slice(0, 7) : "?");
  console.log(`Data release \`${releaseId()}\` (manifest sha256), live in the triplestore and pushed by its
\`scripts/publish_website.sh\` (website#21). Built by LOD-AM/pipeline ${short(m.pipeline?.commit)} with
LOD-AM/knowledge-graph ${short(m.knowledge_graph?.commit)}, created ${m.created || "?"}.

| Publication | | Triples | Change |
|---|---|---:|---:|
${rows.join("\n")}

The workflow checked that only the release files changed and that they match the manifest, fetched
missing AAT labels and added a changelog entry to \`_data/dataReleases.js\`.

**Before merging (owner):**
- the changelog text is shown on /data/: rewrite it to say what changed;
- if \`npm run check:queries\` fails, an example query no longer fits the data (queries/README.md);
- merging deploys the new entity pages.`);
} else fail(`unknown command ${cmd}`);
