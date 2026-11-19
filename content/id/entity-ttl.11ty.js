// Per-record download (planning#13): /id/<kind>/<uuid>.ttl, the record and its helper nodes,
// built from the same data as the record page (_data/lodam.js).
export const data = {
	pagination: { data: "lodam.records", size: 1, alias: "record" },
	permalink: (data) => data.record.files.ttl,
	eleventyExcludeFromCollections: true,
	layout: false,
};
export function render({ record, lodam }) {
	return lodam.turtleOf(record.iri);
}
