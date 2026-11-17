// Old tag pages (/tags/<slug>/) → where their content is now (topics, 2026-11-17).
// Kept so that old links keep working; the site has no server-side redirects.
export default [
	{ from: "/tags/", to: "/topics/", title: "Topics" },
	{ from: "/tags/concept/", to: "/blog/#building-lod-am", title: "the series Building LOD-AM" },
	{ from: "/tags/case-study/", to: "/blog/The_first_example/", title: "Tackling Legacy Data practically" },
	{ from: "/tags/data/", to: "/topics/data-modelling/", title: "data modelling" },
	{ from: "/tags/modelling/", to: "/topics/data-modelling/", title: "data modelling" },
	{ from: "/tags/ontology/", to: "/topics/ontologies/", title: "ontologies" },
	{ from: "/tags/vocabularies/", to: "/topics/controlled-vocabularies/", title: "controlled vocabularies" },
	{ from: "/tags/infrastructure/", to: "/topics/self-hosting/", title: "self-hosting" },
	{ from: "/tags/arslantepe/", to: "/id/site/fc9ee3ea-41b1-4c3d-a174-d553b81bd6d8/", title: "Arslantepe" },
];
