// The data model at a glance (website#20): the diagram on /data/model/ and the list of
// vocabularies. It shows the main records and how they link, for orientation only: the rules
// are in knowledge-graph CONVENTIONS.md, which the page links to and doesn't restate.
// `npm run check` (scripts/check_build.mjs) fails if a property drawn here or a namespace
// listed below no longer occurs in the released data (data/published/*.ttl), so the picture
// can't drift silently from what is published.

// Grid: 4 columns x 6 rows of boxes
const W = 224, H = 60, COL = 328, ROW = 120, PAD = 20;
const x = (c) => PAD + c * COL;
const y = (r) => PAD + r * ROW;

// kind: record = has its own pages here (href = its list), helper = part of a record,
// external = a concept of another vocabulary
const nodes = [
	{ id: "place", c: 0, r: 0, title: "Place", cls: "crm:E53_Place · geo:Feature", kind: "helper" },
	{ id: "site", c: 1, r: 0, title: "Site", cls: "crm:E27_Site", kind: "record", href: "/data/sites/" },
	{ id: "phase", c: 2, r: 0, title: "Phase", cls: "crm:E4_Period", kind: "record", href: "/data/phases/" },
	{ id: "culture", c: 3, r: 0, title: "Culture", cls: "crm:E4_Period", kind: "record", href: "/data/cultures/" },
	{ id: "feature", c: 1, r: 1, title: "Feature", cls: "crm:E25 · crmarchaeo:A2", kind: "record", href: "/data/features/" },
	{ id: "chronology", c: 3, r: 1, title: "Chronology system", cls: "skos:ConceptScheme", kind: "record", href: "/data/chronologies/" },
	{ id: "aat", c: 0, r: 2, title: "Getty AAT concept", cls: "aat:…", kind: "external" },
	{ id: "find", c: 1, r: 2, title: "Find", cls: "crm:E22_Human-Made_Object", kind: "record", href: "/data/finds/" },
	{ id: "pub", c: 3, r: 2, title: "Publication", cls: "fabio:… · crm:E31_Document", kind: "record", href: "/data/publications/" },
	{ id: "type", c: 0, r: 3, title: "Type (LOD-AM typology)", cls: "crm:E55_Type · skos:Concept", kind: "record", href: "/data/types/" },
	{ id: "sampling", c: 1, r: 3, title: "Sampling", cls: "crmsci:S2_Sample_Taking", kind: "helper" },
	{ id: "sample", c: 1, r: 4, title: "Sample", cls: "crmsci:S13_Sample", kind: "helper" },
	{ id: "analysis", c: 2, r: 4, title: "Analysis", cls: "crm:E7_Activity · afp:…", kind: "record", href: "/data/analyses/" },
	{ id: "measurement", c: 3, r: 4, title: "Measurement", cls: "afr:… (value, unit)", kind: "helper" },
	{ id: "lab", c: 2, r: 5, title: "Laboratory", cls: "crm:E74_Group", kind: "record", href: "/data/labs/" },
	{ id: "element", c: 3, r: 5, title: "Element or nuclide", cls: "ChEBI · Wikidata", kind: "external" },
];

// props: the properties in the data (CURIEs, checked against data/published); label: the words
// in the diagram; dashed: a path of the model that the released data don't use (yet)
const edges = [
	{ from: "site", to: "place", label: "located at", props: ["crm:P53_has_former_or_current_location"] },
	{ from: "feature", to: "site", label: "part of", props: ["crm:P46i_forms_part_of"] },
	{ from: "feature", to: "phase", label: "dated to", props: ["crm:P8i_witnessed"] },
	{ from: "phase", to: "culture", label: "part of", props: ["crm:P9i_forms_part_of"] },
	{ from: "phase", to: "chronology", label: "in system", props: ["skos:inScheme"] },
	{ from: "chronology", to: "pub", label: "source", props: ["dcterms:source"] },
	{ from: "find", to: "feature", label: "found in", props: ["crmarchaeo:AP21i_is_contained_in"] },
	{ from: "find", to: "place", label: "located at", props: ["crm:P53_has_former_or_current_location"], dashed: true,
		note: "only for finds known by their site alone, without a feature" },
	{ from: "find", to: "aat", label: "material", props: ["crm:P45_consists_of"] },
	{ from: "find", to: "type", label: "type", props: ["crm:P2_has_type"] },
	{ from: "type", to: "aat", label: "matches", props: ["skos:closeMatch", "skos:broadMatch"] },
	{ from: "find", to: "pub", label: "documented in", props: ["crm:P70i_is_documented_in"] },
	{ from: "sampling", to: "find", label: "sampled from", props: ["crmsci:O3_sampled_from"] },
	{ from: "sampling", to: "sample", label: "removed", props: ["crmsci:O5_removed"] },
	{ from: "analysis", to: "sample", label: "input", props: ["afx:AFX_0000399"] },
	{ from: "analysis", to: "measurement", label: "output", props: ["afx:AFX_0000395"] },
	{ from: "measurement", to: "element", label: "quantifies", props: ["afx:AFX_0002816"] },
	{ from: "analysis", to: "lab", label: "carried out by", props: ["crm:P14_carried_out_by"] },
	{ from: "analysis", to: "pub", label: "documented in", props: ["crm:P70i_is_documented_in"] },
];

// Point where the line from a box's centre towards (tx, ty) leaves the box, plus a gap
function exitPoint(n, tx, ty, gap) {
	const cx = x(n.c) + W / 2, cy = y(n.r) + H / 2;
	const dx = tx - cx, dy = ty - cy;
	const s = Math.min(dx ? (W / 2 + gap) / Math.abs(dx) : Infinity, dy ? (H / 2 + gap) / Math.abs(dy) : Infinity);
	return [cx + dx * s, cy + dy * s];
}

const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
const round = (v) => Math.round(v * 10) / 10;

export default {
	width: PAD * 2 + 3 * COL + W,
	height: PAD * 2 + 5 * ROW + H,
	nodes: nodes.map((n) => ({ ...n, x: x(n.c), y: y(n.r), w: W, h: H })),
	edges: edges.map((e) => {
		const a = byId[e.from], b = byId[e.to];
		const [x1, y1] = exitPoint(a, x(b.c) + W / 2, y(b.r) + H / 2, 2);
		const [x2, y2] = exitPoint(b, x(a.c) + W / 2, y(a.r) + H / 2, 6);
		const lw = e.label.length * 6.6 + 10; // label background, ~12px font
		return { ...e, fromTitle: a.title, toTitle: b.title, x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2),
			lx: round((x1 + x2) / 2), ly: round((y1 + y2) / 2), lw: round(lw) };
	}),
	// Vocabularies used by the released data. ns = the namespace as it appears in the data
	// (checked); url = the vocabulary's own page, only where it was checked to load (2026-11-23).
	vocabularies: [
		{ name: "CIDOC CRM", version: "7.1.3", usedFor: "finds, sites, features, places, periods, identifiers", ns: "http://www.cidoc-crm.org/cidoc-crm/", url: "https://cidoc-crm.org/Version/version-7.1.3" },
		{ name: "CRMsci", version: "3.2", usedFor: "sampling and samples", ns: "http://www.cidoc-crm.org/extensions/crmsci/", url: "https://cidoc-crm.org/crmsci" },
		{ name: "CRMarchaeo", version: "2.1.1", usedFor: "finds in their archaeological features", ns: "http://www.cidoc-crm.org/extensions/crmarchaeo/", url: "https://cidoc-crm.org/crmarchaeo" },
		{ name: "Allotrope Foundation Ontologies (AFO)", version: "REC/2025/12", usedFor: "analyses, measurements, sample materials", ns: "http://purl.allotrope.org/ontologies/" },
		{ name: "QUDT", usedFor: "values and units", ns: "http://qudt.org/" },
		{ name: "FaBiO", usedFor: "publications and journals", ns: "http://purl.org/spar/fabio/", url: "https://sparontologies.github.io/fabio/current/fabio.html" },
		{ name: "Dublin Core Terms, PRISM, FOAF", usedFor: "titles, authors, pages, DOIs", ns: "http://purl.org/dc/terms/" },
		{ name: "SKOS", usedFor: "the typology, local vocabularies, chronology systems", ns: "http://www.w3.org/2004/02/skos/core#" },
		{ name: "GeoSPARQL", usedFor: "site coordinates", ns: "http://www.opengis.net/ont/geosparql#" },
		{ name: "Getty Art & Architecture Thesaurus (AAT)", usedFor: "materials; matches of types and feature types", ns: "http://vocab.getty.edu/aat/" },
		{ name: "ChEBI", usedFor: "chemical elements", ns: "http://purl.obolibrary.org/obo/CHEBI_", url: "https://www.ebi.ac.uk/chebi/" },
		{ name: "Wikidata", usedFor: "lead isotopes (nuclides)", ns: "http://www.wikidata.org/entity/", url: "https://www.wikidata.org/" },
		{ name: "ROR", usedFor: "laboratories", ns: "https://ror.org/" },
	],
};
