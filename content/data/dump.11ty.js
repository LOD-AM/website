// All released data in one file (website#19): /data/lod-am.ttl, built from data/published/*.ttl
// by _data/lodam.js (dumpOf).
export const data = {
	permalink: (data) => data.lodam.dump.path,
	eleventyExcludeFromCollections: true,
	layout: false,
};
export function render({ lodam }) {
	return lodam.dumpOf();
}
