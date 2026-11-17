// Labels of the Getty AAT concepts used in data/published/*.ttl, for the entity pages.
// Writes _data/aatLabels.json (committed), so neither the build nor visitors contact Getty.
// Run after adding a released dataset: node scripts/aat_labels.mjs
// Only ids without a label are fetched; existing labels are kept. Uses the AAT preferred
// term (gvp:prefLabelGVP). The first labels (2026-11-17) came from the owner-checked
// typology and feature-type lists in LOD-AM/ingest (docs/review/2026-11-15_typology.csv,
// 2026-11-16_feature_types.csv) and knowledge-graph,
// because the Getty endpoint was degraded. Node needs NODE_USE_ENV_PROXY=1 behind a proxy.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const OUT = "_data/aatLabels.json";
const labels = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

const ids = new Set();
for (const f of readdirSync("data/published").filter((f) => f.endsWith(".ttl"))) {
  for (const [, id] of readFileSync(`data/published/${f}`, "utf8").matchAll(/(?:http:\/\/vocab\.getty\.edu\/aat\/|\baat:)(\d+)\b/g)) ids.add(id);
}
const todo = [...ids].filter((id) => !labels[id]);
if (!todo.length) { console.log(`${OUT}: all ${ids.size} AAT ids have a label`); process.exit(0); }
const query = `PREFIX gvp: <http://vocab.getty.edu/ontology#>
PREFIX xl: <http://www.w3.org/2008/05/skos-xl#>
SELECT ?s ?label WHERE {
  VALUES ?s { ${todo.map((id) => `<http://vocab.getty.edu/aat/${id}>`).join(" ")} }
  ?s gvp:prefLabelGVP/xl:literalForm ?label .
}`;
const res = await fetch("https://vocab.getty.edu/sparql.json?query=" + encodeURIComponent(query));
if (!res.ok) throw new Error(`Getty SPARQL: HTTP ${res.status}`);
for (const b of (await res.json()).results.bindings) labels[b.s.value.split("/").pop()] = b.label.value;
const missing = [...ids].filter((id) => !labels[id]);
if (missing.length) throw new Error(`no label for AAT ${missing.join(", ")}`);
const sorted = Object.fromEntries(Object.entries(labels).sort());
writeFileSync(OUT, JSON.stringify(sorted, null, 1) + "\n");
console.log(`${OUT}: ${Object.keys(sorted).length} AAT labels`);
