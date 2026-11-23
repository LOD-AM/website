// Dated corrections of published posts (website#17). Published posts are a diary and stay as
// they were written; a correction goes in as a dated note, and the post gets an `updated:` date.
//
//   updated: 2026-11-20                       front matter: date of the latest change
//   {% update "2026-11-20" %}FaBiO replaced FRBRoo, see …{% endupdate %}
//
// `updated` is shown as "Updated on …" next to "Posted on …" and used for the JSON-LD
// dateModified, the feed's <updated> and the sitemap's <lastmod>. The build stops if a date is
// not YYYY-MM-DD, lies before the post's date, or if a note is newer than `updated` (so the
// three dates can't drift apart). The note's text is Markdown.
import { DateTime } from "luxon";
import { readFileSync } from "node:fs";

// "YYYY-MM-DD" (or the Date YAML makes of an unquoted date) -> Date at 00:00 UTC
export function toDate(value, what) {
	const iso = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "").trim();
	const dt = DateTime.fromISO(iso, { zone: "utc" });
	if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !dt.isValid) throw new Error(`${what}: "${value}" is not a date (YYYY-MM-DD)`);
	return dt.toJSDate();
}

const day = (d) => d.toISOString().slice(0, 10);

// eleventyComputed.updated for blog posts: the validated date, or undefined
export function computeUpdated(data) {
	if (data.updated === undefined || data.updated === null || data.updated === "") return undefined;
	const where = data.page?.inputPath || "post";
	// YAML turns an impossible date such as 2026-13-40 into a valid Date (2027-02-09), so the
	// value is checked as written in the front matter
	let written = data.updated;
	try {
		const fm = readFileSync(where, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
		const m = fm && fm[1].match(/^updated:\s*["']?([^"'\s#]+)["']?\s*(#.*)?$/m);
		if (m) written = m[1];
	} catch { /* no file (e.g. a virtual template): use the parsed value */ }
	const updated = toDate(written, `${where}: updated`);
	if (data.page?.date && day(updated) < day(data.page.date))
		throw new Error(`${where}: updated (${day(updated)}) is before the post's date (${day(data.page.date)})`);
	return updated;
}

export default function (eleventyConfig) {
	// Last change of a post: `updated`, else its date. Takes a collection item or page data.
	eleventyConfig.addFilter("lastModified", (item) => {
		const data = item?.data || item || {};
		return data.updated || item?.date || data.page?.date;
	});
	// Newest last change in a collection (the feed's <updated>)
	eleventyConfig.addFilter("newestModified", (items) =>
		new Date(Math.max(...(items || []).map((p) => (p.data.updated || p.date).getTime()))));

	// The note box. Blank lines around the content let Markdown render it inside the <aside>.
	eleventyConfig.addPairedShortcode("update", function (content, date) {
		const where = this.page?.inputPath || "post";
		const d = toDate(date, `${where}: {% update %}`);
		const updated = this.ctx?.updated;
		if (!updated || day(d) > day(updated))
			throw new Error(`${where}: an update note is dated ${day(d)}; set "updated: ${day(d)}" (or later) in the front matter`);
		if (this.page?.date && day(d) < day(this.page.date))
			throw new Error(`${where}: an update note (${day(d)}) is dated before the post (${day(this.page.date)})`);
		const label = DateTime.fromJSDate(d, { zone: "utc" }).toFormat("dd LLLL yyyy");
		return `<aside class="update-note" aria-label="Update of ${label}">\n<p class="update-note__label"><strong>Update</strong>, <time datetime="${day(d)}">${label}</time></p>\n\n${content.trim()}\n\n</aside>`;
	});
}
