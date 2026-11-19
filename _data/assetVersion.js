// Version of the site's own CSS/JS, appended to their URLs (?v=...), so browsers load the new
// files after a deploy instead of a cached old copy (owner, 2026-11-19: the map marker was not
// visible with an old cached theme.css). A short hash of the files' contents.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const h = createHash("sha256");
for (const f of ["css/theme.css", "public/js/theme.js"]) h.update(readFileSync(f));
export default h.digest("hex").slice(0, 10);
