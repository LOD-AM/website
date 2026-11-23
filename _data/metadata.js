export default {
	title: "Linked Open Data for Ancient Metallurgy",
	url: "https://lod-am.net/",
	language: "en",
	description: "A sandbox project dedicated to ancient metallurgical & open data methodologies.",
	// Current release of the website and its data (Zenodo DOI per release, owner): used in
	// "Cite this record" on the data pages. Set version, doi (without https://doi.org/) and
	// date (YYYY-MM-DD) at each release; empty = no release yet.
	release: { version: "", doi: "", date: "" },
	// Public, read-only SPARQL endpoint of the LOD-AM triplestore (planning#22): the released
	// publications plus the knowledge-graph vocabularies, the same data as the record pages.
	// Used by the query editor /query/ (YASGUI) and the Data page.
	sparqlEndpoint: "https://triple.lod-am.net/LOD-AM/sparql",
	author: {
		name: "Fabian Fricke",
		email: "info@lod-am.net",
		url: "https://lod-am.net/about/",
		// Profiles for schema.org sameAs (JSON-LD). Add ORCID here if wanted.
		sameAs: ["https://archaeo.social/@FabianF"]
	}
}