// Header of an example query (queries/*.rq, see queries/README.md): "# key: value" lines at the
// top; repeated keys are joined with a space. Used by scripts/check_queries.mjs and
// _data/exampleQueries.js (the examples page), so both read the same fields.
export function readHeader(text) {
  const header = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^#\s*([a-z-]+):\s*(.*)$/);
    if (m) header[m[1]] = header[m[1]] ? `${header[m[1]]} ${m[2]}` : m[2];
    else if (!line.startsWith("#")) break;
  }
  return header;
}
