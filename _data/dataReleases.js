// Data releases on lod-am.net (planning#15): the data changelog, newest first. Add an entry
// whenever a publication is released or released data changes. `publications` = citation keys
// of data/published/<key>.ttl; npm run check fails if a released file has no entry here.
// Versions and DOIs of the whole website release are in _data/metadata.js -> release.
export default [
	{
		date: "2026-11-19",
		publications: ["hauptmann2002chemical"],
		changes: "Chronology systems name their source publication (Arslantepe periods: Vignola et al. 2019; Tepe Gawra periods: Rothman and Peasnall 2002), whose bibliographic records are added. Corrected title of Hauptmann et al. 2002.",
	},
	{
		date: "2026-11-17",
		publications: ["hauptmann2002chemical"],
		changes: "First release: the finds and analyses reported in Hauptmann et al. 2002 (Arslantepe), with the sites, contexts, phases, types, laboratories and persons they refer to.",
	},
];
