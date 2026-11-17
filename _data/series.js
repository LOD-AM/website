// Blog series. A post belongs to a series by its file name (page.fileSlug), so
// the published posts themselves stay untouched. Order = reading order.
export default [
	{
		id: "building-lod-am",
		title: "Building LOD-AM",
		// DRAFT by Claude: the owner rewrites this text (website#15).
		intro: "New here? This series tells how LOD-AM came about, from the first idea and the homelab to the first real data. Best read in order.",
		parts: [
			"How_I_started",
			"The_infrastructure",
			"The_ontologies",
			"The_vocabularies",
			"The_first_example",
			"Learning_by_Doing_My First_Data_Example",
		],
	},
	{
		id: "becoming-operational",
		title: "Becoming Operational",
		// DRAFT by Claude: the owner rewrites this text.
		intro: "How LOD-AM went from a hand-written example to its first complete dataset online: a new assistant, new conventions, our own vocabularies, and Arslantepe.",
		parts: [
			"Becoming_operational_Claude",
			"Becoming_operational_Conventions",
			"Becoming_operational_Vocabularies",
			"Becoming_operational_Arslantepe",
		],
	},
];
