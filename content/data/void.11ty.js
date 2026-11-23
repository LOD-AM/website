// VoID description of the released data (website#19): /data/void.ttl, built by _data/lodam.js
// (voidOf): the whole dataset with its dump and SPARQL endpoint, one subset per publication.
export const data = {
	permalink: (data) => data.lodam.dump.voidPath,
	eleventyExcludeFromCollections: true,
	layout: false,
};
export function render({ lodam }) {
	return lodam.voidOf();
}
