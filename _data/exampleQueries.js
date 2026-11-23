// Example SPARQL queries (queries/*.rq, LOD-AM/planning#24) for the examples page
// /query/examples/ (planning#22). The header format is described in queries/README.md;
// scripts/check_queries.mjs runs the same files against the released data in CI.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { readHeader } from "../scripts/query_header.mjs";

const DIR = "queries";

// The query without its header comment (the header is shown as text on the page)
function body(text) {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].startsWith("#")) i++;
  return lines.slice(i).join("\n").trim() + "\n";
}

export default function () {
  return readdirSync(DIR).filter((f) => f.endsWith(".rq")).sort().map((file) => {
    const text = readFileSync(join(DIR, file), "utf8");
    const h = readHeader(text);
    const slug = file.replace(/^\d+-/, "").replace(/\.rq$/, "");
    return {
      file,
      slug,
      title: h.title,
      question: h.question,
      columns: (h.columns || "").split(/\s+/).filter(Boolean),
      conventions: h.conventions,
      note: h.note,
      query: body(text),
    };
  });
}
