// Example SPARQL queries (LOD-AM/planning#24): runs every queries/*.rq against the released
// data (data/published/*.ttl + data/vocab/*.ttl) with Comunica, in memory, no server.
//
//   node scripts/check_queries.mjs            check all queries (CI)
//   node scripts/check_queries.mjs --show     also print the first rows of each result
//   node scripts/check_queries.mjs <file.rq>  only this query (with --show)
//
// Each query starts with a header of "# key: value" lines (see queries/README.md):
// title, question, columns (the SELECT variables, in order) and optionally min-rows
// (default 1). A query fails if it doesn't parse, returns other columns than declared,
// or fewer rows than min-rows, so a change to the data or the conventions can't
// silently break an example.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { Parser, Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { readHeader } from "./query_header.mjs";

const args = process.argv.slice(2);
const show = args.includes("--show");
const only = args.filter((a) => a.endsWith(".rq"));

const store = new Store();
for (const dir of ["data/published", "data/vocab"]) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".ttl")).sort())
    store.addQuads(new Parser().parse(readFileSync(join(dir, f), "utf8")));
}

const files = only.length ? only : readdirSync("queries").filter((f) => f.endsWith(".rq")).sort().map((f) => join("queries", f));
const engine = new QueryEngine();
let failed = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const h = readHeader(text);
  const problems = [];
  for (const k of ["title", "question", "columns"]) if (!h[k]) problems.push(`header "${k}" missing`);
  let rows = [], vars = [];
  try {
    const result = await engine.query(text, { sources: [store] });
    if (result.resultType !== "bindings") throw new Error(`a SELECT query is expected, got ${result.resultType}`);
    vars = (await result.metadata()).variables.map((v) => (v.variable ?? v).value);
    rows = await (await result.execute()).toArray();
  } catch (e) { problems.push(`query fails: ${e.message.split("\n")[0]}`); }
  const declared = (h.columns || "").split(/\s+/).filter(Boolean);
  if (!problems.length && declared.join(" ") !== vars.join(" ")) problems.push(`columns are "${vars.join(" ")}", header says "${declared.join(" ")}"`);
  const min = Number(h["min-rows"] ?? 1);
  if (!problems.length && rows.length < min) problems.push(`${rows.length} rows, expected at least ${min}`);
  console.log(`${problems.length ? "FAIL" : "ok  "} ${basename(file)}: ${rows.length} rows${problems.length ? "\n       " + problems.join("\n       ") : ""}`);
  if (show && rows.length) {
    const cell = (b, v) => { const t = b.get(v); return t ? (t.termType === "Literal" ? t.value + (t.language ? `@${t.language}` : "") : `<${t.value.replace("https://lod-am.net/id/", ":")}>`) : ""; };
    for (const b of rows.slice(0, 6)) console.log("       " + vars.map((v) => cell(b, v)).join(" | "));
  }
  failed += problems.length ? 1 : 0;
}
if (!files.length) { console.log("FAIL no queries in queries/"); failed = 1; }
console.log(failed ? `${failed} of ${files.length} example queries failed` : `all ${files.length} example queries ok`);
process.exit(failed ? 1 : 0);
