// LOD-AM entity data for the entity pages /id/<kind>/<uuid>/ (website#18).
//
// Reads the released datasets in data/published/*.ttl (exported from LOD-AM/ingest by
// scripts/rdf/export_publication.sh, one file per publication the owner released) and the
// knowledge-graph vocabulary copied into data/vocab/ (local concepts, verified ChEBI and
// Wikidata ids). Builds one view per LOD-AM record: facts, tables and links, grouped by
// meaning. The patterns are those of knowledge-graph CONVENTIONS.md; this file only reads
// them. Every triple of a record that no section shows ends up under "Other statements",
// so nothing is silently dropped.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Parser } from "n3";

const aatLabels = JSON.parse(readFileSync("_data/aatLabels.json", "utf8"));

const ID = "https://lod-am.net/id/";
const NS = {
	rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
	rdfs: "http://www.w3.org/2000/01/rdf-schema#",
	skos: "http://www.w3.org/2004/02/skos/core#",
	crm: "http://www.cidoc-crm.org/cidoc-crm/",
	crmsci: "http://www.cidoc-crm.org/extensions/crmsci/",
	crmarchaeo: "http://www.cidoc-crm.org/extensions/crmarchaeo/",
	geo: "http://www.opengis.net/ont/geosparql#",
	afx: "http://purl.allotrope.org/ontologies/property#",
	afr: "http://purl.allotrope.org/ontologies/result#",
	afp: "http://purl.allotrope.org/ontologies/process#",
	afm: "http://purl.allotrope.org/ontologies/material#",
	qudt: "http://qudt.org/schema/qudt#",
	unit: "http://qudt.org/vocab/unit#",
	dcterms: "http://purl.org/dc/terms/",
	fabio: "http://purl.org/spar/fabio/",
	prism: "http://prismstandard.org/namespaces/basic/2.0/",
	foaf: "http://xmlns.com/foaf/0.1/",
	owl: "http://www.w3.org/2002/07/owl#",
	xsd: "http://www.w3.org/2001/XMLSchema#",
	chebi: "http://purl.obolibrary.org/obo/CHEBI_",
	wd: "http://www.wikidata.org/entity/",
	aat: "http://vocab.getty.edu/aat/",
};
const P = (prefix, local) => NS[prefix] + local;
const curie = (iri) => {
	for (const [p, ns] of Object.entries(NS)) if (iri.startsWith(ns)) return `${p}:${iri.slice(ns.length)}`;
	return iri.startsWith(ID) ? ":" + iri.slice(ID.length) : iri;
};

// Kinds of records that get a page (CONVENTIONS "IRIs"), in display order
const KINDS = {
	site: { singular: "Site", plural: "Sites", slug: "sites" },
	feature: { singular: "Feature", plural: "Features", slug: "features" },
	find: { singular: "Find", plural: "Finds", slug: "finds" },
	analysis: { singular: "Analysis", plural: "Analyses", slug: "analyses" },
	type: { singular: "Type", plural: "Types", slug: "types" },
	period: { singular: "Phase", plural: "Phases", slug: "phases" },
	culture: { singular: "Culture", plural: "Cultures", slug: "cultures" },
	chronology: { singular: "Chronology system", plural: "Chronology systems", slug: "chronologies" },
	region: { singular: "Region", plural: "Regions", slug: "regions" },
	lab: { singular: "Laboratory", plural: "Laboratories", slug: "labs" },
	person: { singular: "Person", plural: "Persons", slug: "persons" },
	journal: { singular: "Journal", plural: "Journals", slug: "journals" },
};

// Names of classes used as "what is this" (labels as in the ontologies)
const CLASS_LABELS = {
	[P("crm", "E22_Human-Made_Object")]: "Human-Made Object (CIDOC CRM E22)",
	[P("crm", "E27_Site")]: "Site (CIDOC CRM E27)",
	[P("crm", "E25_Human-Made_Feature")]: "Human-Made Feature (CIDOC CRM E25)",
	[P("crmarchaeo", "A2_Stratigraphic_Volume_Unit")]: "Stratigraphic Volume Unit (CRMarchaeo A2)",
	[P("crm", "E7_Activity")]: "Activity (CIDOC CRM E7)",
	[P("crm", "E4_Period")]: "Period (CIDOC CRM E4)",
	[P("crm", "E55_Type")]: "Type (CIDOC CRM E55)",
	[P("crm", "E53_Place")]: "Place (CIDOC CRM E53)",
	[P("crm", "E74_Group")]: "Group (CIDOC CRM E74)",
	[P("crm", "E31_Document")]: "Document (CIDOC CRM E31)",
	[P("skos", "Concept")]: "SKOS concept",
	[P("skos", "ConceptScheme")]: "SKOS concept scheme",
	[P("foaf", "Person")]: "Person (FOAF)",
	[P("fabio", "Journal")]: "Journal (FaBiO)",
	[P("fabio", "JournalArticle")]: "Journal article (FaBiO)",
	[P("afp", "AFP_0002680")]: "assay (AFO)",
	[P("afp", "AFP_0001427")]: "mass spectrometry (AFO)",
	[P("afr", "AFR_0002099")]: "mass fraction (AFO)",
	[P("afr", "AFR_0002368")]: "analyte molar ratio (AFO)",
	[P("afm", "AFM_0001099")]: "chemical mixture (AFO)",
	[P("crmsci", "S13_Sample")]: "Sample (CRMsci S13)",
};
const UNIT_LABELS = { [P("unit", "PERCENT")]: "wt %" };

// --- Load ------------------------------------------------------------------------------------
function readTsv(file) {
	return readFileSync(file, "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split("\t"));
}

const quads = [];
const datasets = [];
for (const sub of ["published", "vocab"]) {
	const dir = join("data", sub);
	if (!existsSync(dir)) continue;
	for (const f of readdirSync(dir).filter((f) => f.endsWith(".ttl")).sort()) {
		const q = new Parser().parse(readFileSync(join(dir, f), "utf8"));
		quads.push(...q);
		if (sub === "published") datasets.push({ key: f.replace(/\.ttl$/, ""), file: `/data/${f}`, source: join(dir, f), triples: q.length });
	}
}
// ChEBI elements and Wikidata items verified in knowledge-graph (tools/*.tsv, copied)
const elements = new Map(readTsv("data/vocab/chebi.tsv").map(([id, label, symbol], i) => [NS.chebi + id.replace(/^CHEBI_/, ""), { label, symbol, order: i }]));
const wikidata = new Map(readTsv("data/vocab/wikidata.tsv").map(([id, label]) => [NS.wd + id, label]));

const out = new Map(), inc = new Map();
function add(m, a, p, b) {
	if (!m.has(a)) m.set(a, new Map());
	const pm = m.get(a);
	if (!pm.has(p)) pm.set(p, []);
	if (!pm.get(p).some((x) => x.value === b.value && x.language === b.language)) pm.get(p).push(b);
}
for (const q of quads) {
	const o = q.object.termType === "Literal"
		? { literal: true, value: q.object.value, language: q.object.language || "", datatype: q.object.datatype?.value }
		: { literal: false, value: q.object.value };
	add(out, q.subject.value, q.predicate.value, o);
	if (!o.literal) add(inc, o.value, q.predicate.value, { literal: false, value: q.subject.value });
}

// --- Access helpers -------------------------------------------------------------------------
const objs = (s, p) => out.get(s)?.get(p) || [];
const subs = (o, p) => (inc.get(o)?.get(p) || []).map((x) => x.value);
const iris = (s, p) => objs(s, p).filter((o) => !o.literal).map((o) => o.value);
const first = (s, p) => objs(s, p)[0]?.value;
const types = (s) => iris(s, P("rdf", "type"));
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const LANG_NAMES = { en: "English", de: "German", ru: "Russian", tr: "Turkish", ka: "Georgian", hy: "Armenian", az: "Azerbaijani", uk: "Ukrainian", "": "no language" };

function pick(literals, lang = "en") {
	return (literals.find((l) => l.language === lang) || literals.find((l) => l.language === "en")
		|| literals.find((l) => !l.language) || literals[0])?.value;
}
function labelOf(iri) {
	for (const p of [P("rdfs", "label"), P("skos", "prefLabel"), P("foaf", "name"), P("dcterms", "title")]) {
		const l = pick(objs(iri, p));
		if (l) return l;
	}
	return null;
}

function kindOf(iri) {
	if (!iri.startsWith(ID)) return null;
	const parts = iri.slice(ID.length).split("/");
	return parts.length === 2 && KINDS[parts[0]] ? parts[0] : null;
}
const pathOf = (iri) => "/id/" + iri.slice(ID.length) + "/";
const isPublication = (iri) => types(iri).includes(P("crm", "E31_Document")) && objs(iri, P("dcterms", "title")).length > 0;
const pubKey = (iri) => first(iri, P("dcterms", "identifier")) || iri.split("/").pop();

// First author: the creator whose family name starts the citation key (dcterms:creator has
// no order in RDF; the citation key is "<first author><year><word>")
function authorsOf(pub) {
	const key = (pubKey(pub) || "").toLowerCase();
	const fold = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
	const people = iris(pub, P("dcterms", "creator")).map((a) => ({ iri: a, family: first(a, P("foaf", "familyName")) || labelOf(a), name: labelOf(a) }));
	people.sort((a, b) => (key.startsWith(fold(b.family)) ? 1 : 0) - (key.startsWith(fold(a.family)) ? 1 : 0) || collator.compare(a.family, b.family));
	return people;
}
function citation(pub) {
	const a = authorsOf(pub);
	const who = a.length > 2 ? `${a[0].family} et al.` : a.map((x) => x.family).join(" and ");
	return `${who || "Anonymous"} ${first(pub, P("fabio", "hasPublicationYear")) || "n.d."}`;
}

// A link (or text) for any IRI: own page, publication page, external IRI with a readable name
function link(iri) {
	if (kindOf(iri) && out.has(iri)) return { href: pathOf(iri), text: labelOf(iri) || iri.slice(ID.length) };
	if (isPublication(iri)) return { href: `/data/publications/${pubKey(iri)}/`, text: `${citation(iri)}: ${first(iri, P("dcterms", "title"))}` };
	if (iri.startsWith(ID) && labelOf(iri)) return { text: labelOf(iri), title: curie(iri) };  // local concept (knowledge-graph vocab)
	let m;
	if ((m = iri.match(/^http:\/\/vocab\.getty\.edu\/aat\/(\d+)$/))) return { href: iri, text: aatLabels[m[1]] ? `${aatLabels[m[1]]} (AAT)` : `AAT ${m[1]}`, external: true };
	if (elements.has(iri)) return { href: iri, text: `${elements.get(iri).label} (${elements.get(iri).symbol})`, external: true };
	if (wikidata.has(iri)) return { href: iri, text: wikidata.get(iri), external: true };
	if (CLASS_LABELS[iri]) return { href: iri, text: CLASS_LABELS[iri], external: true };
	if (UNIT_LABELS[iri]) return { href: iri, text: UNIT_LABELS[iri], external: true };
	if ((m = iri.match(/^https:\/\/ror\.org\/(\w+)$/))) return { href: iri, text: `ROR ${m[1]}`, external: true };
	return { href: iri, text: labelOf(iri) || curie(iri), external: !iri.startsWith(ID) };
}
const lit = (o) => ({ text: o.value, lang: o.language || undefined });
const val = (o) => (o.literal ? lit(o) : link(o.value));
const sortLinks = (ls) => ls.sort((a, b) => collator.compare(a.text, b.text));

// Years as in the data: "-2800" = 2800 BC (CONVENTIONS "Local periods"); never computed further
const year = (y) => (y == null ? "?" : y.startsWith("-") ? `${y.slice(1)} BC` : `AD ${y}`);

// --- Views ------------------------------------------------------------------------------------
function makeView(iri, kind) {
	const used = new Set();                         // predicates shown (outgoing)
	const facts = [];                               // [{label, values:[{text, href?, lang?}]}]
	const sections = [];                            // [{heading, list?:[links], table?:{head, rows}}]
	const use = (p) => { used.add(p); return objs(iri, p); };
	const fact = (label, values) => { if (values.length) facts.push({ label, values }); };
	const list = (heading, links) => { if (links.length) sections.push({ heading, list: sortLinks(links) }); };

	// Names: every label with its language
	const names = [...use(P("rdfs", "label")), ...use(P("skos", "prefLabel")), ...use(P("foaf", "name"))];
	if (names.length > 1) fact("Names", names.map((l) => ({ text: l.value, lang: l.language || undefined, note: LANG_NAMES[l.language] || l.language })));
	fact("Class", use(P("rdf", "type")).map(val));

	// Types and identifiers, the same for every kind
	fact("Type", use(P("crm", "P2_has_type")).map(val));
	const ids = use(P("crm", "P1_is_identified_by")).map((o) => {
		const content = first(o.value, P("crm", "P190_has_symbolic_content"));
		const t = iris(o.value, P("crm", "P2_has_type")).map((x) => link(x).text).join(", ");
		const isUrl = /^https?:\/\//.test(content || "");
		return { text: content || o.value, href: isUrl ? content : undefined, external: isUrl, note: t || undefined };
	});
	fact("Identifiers", ids);
	fact("Identifier", use(P("dcterms", "identifier")).map(lit));
	fact("Note (from the source)", use(P("crm", "P3_has_note")).map(lit));

	if (kind === "find") {
		fact("Material", use(P("crm", "P45_consists_of")).map(val));
		const ctx = use(P("crmarchaeo", "AP21i_is_contained_in")).map(val);
		fact("Found in (feature)", ctx);
		// Finds without a feature point to their site's place (CONVENTIONS "Finds without a feature")
		const places = use(P("crm", "P53_has_former_or_current_location")).map((o) => o.value);
		fact("Found at (site)", places.flatMap((pl) => subs(pl, P("crm", "P53_has_former_or_current_location")).filter((s) => kindOf(s) === "site")).map(link));
		const dating = [...iris(iri, P("crmarchaeo", "AP21i_is_contained_in")), ...places.flatMap((pl) => subs(pl, P("crm", "P53_has_former_or_current_location")))]
			.flatMap((c) => iris(c, P("crm", "P8i_witnessed")));
		fact("Dated by its context to", [...new Set(dating)].map(link));
		fact("Parts", use(P("crm", "P46_is_composed_of")).map(val));
		fact("Part of", use(P("crm", "P46i_forms_part_of")).map(val));
		// Analyses: sampling events (O3) of the find or its parts → sample (O5) → analysis (input)
		const sampled = [iri, ...iris(iri, P("crm", "P46_is_composed_of"))];
		const analyses = sampled.flatMap((x) => subs(x, P("crmsci", "O3_sampled_from")))
			.flatMap((st) => iris(st, P("crmsci", "O5_removed")))
			.flatMap((smp) => subs(smp, P("afx", "AFX_0000399")));
		list("Analyses", [...new Set(analyses)].map(link));
	}

	if (kind === "analysis") {
		fact("Carried out by", use(P("crm", "P14_carried_out_by")).map(val));
		const samples = use(P("afx", "AFX_0000399")).map((o) => o.value);
		fact("Sample", samples.map((s) => ({ text: labelOf(s) || curie(s) })));
		fact("Sampled object", samples.flatMap((s) => subs(s, P("crmsci", "O5_removed"))).flatMap((st) => iris(st, P("crmsci", "O3_sampled_from"))).map(link));
		// Results (has output): element mass fractions and lead isotope ratios
		const outputs = use(P("afx", "AFX_0000395")).map((o) => o.value);
		const elementRows = [], ratioRows = [];
		for (const m of outputs) {
			const t = types(m);
			const analyte = first(m, P("afx", "AFX_0002816"));
			const value = first(m, P("qudt", "numericValue"));
			const max = iris(m, P("afx", "AFX_0000331")).map((x) => first(x, P("qudt", "numericValue")))[0];
			const notDetected = iris(m, P("crm", "P2_has_type")).includes(ID + "not_detected");
			const shown = value != null ? { text: value, num: true } : max != null ? { text: `< ${max}`, num: true } : notDetected ? { text: "not detected", note: true } : { text: "–" };
			if (t.includes(P("afr", "AFR_0002368"))) {
				const ref = first(m, P("afx", "AFX_0001550"));
				ratioRows.push({ sort: `${wikidata.get(analyte)}/${wikidata.get(ref)}`, cells: [{ text: `${wikidata.get(analyte) || curie(analyte)} / ${wikidata.get(ref) || curie(ref)}` }, shown] });
			} else {
				const e = elements.get(analyte);
				elementRows.push({ sort: e ? e.order : 999, cells: [e ? { text: e.symbol, title: e.label, href: analyte, external: true } : link(analyte), shown, { text: UNIT_LABELS[first(m, P("qudt", "unit"))] || (first(m, P("qudt", "unit")) ? curie(first(m, P("qudt", "unit"))) : "") }] });
			}
		}
		if (elementRows.length) sections.push({ heading: "Composition", caption: "Mass fractions as reported in the publication; “< x” = below x; “not detected” = looked for, not found. Copper is not given for copper-base objects; other elements not listed were not analysed.", table: { head: ["Element", "Value", "Unit"], numeric: [1], rows: elementRows.sort((a, b) => a.sort - b.sort).map((r) => r.cells) } });
		if (ratioRows.length) sections.push({ heading: "Lead isotope ratios", caption: "Ratios as reported (dimensionless).", table: { head: ["Ratio", "Value"], numeric: [1], rows: ratioRows.sort((a, b) => collator.compare(a.sort, b.sort)).map((r) => r.cells) } });
	}

	if (kind === "site" || kind === "feature" || kind === "region") {
		const places = use(P("crm", "P53_has_former_or_current_location")).map((o) => o.value);
		if (objs(iri, P("geo", "hasGeometry")).length) used.add(P("geo", "hasGeometry"));  // regions carry their own geometry
		const loc = [...places, ...(used.has(P("geo", "hasGeometry")) ? [iri] : [])].map((pl) => {
			const wkt = iris(pl, P("geo", "hasGeometry")).map((g) => first(g, P("geo", "asWKT")))[0] || "";
			const pt = wkt.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
			const certainty = iris(pl, P("crm", "P2_has_type")).map((x) => link(x).text).join(", ");
			if (pt) return { text: `${pt[2]}° N, ${pt[1]}° E`, note: ["WGS 84", certainty].filter(Boolean).join("; ") };
			return wkt ? { text: wkt.startsWith("POLYGON") || wkt.startsWith("MULTIPOLYGON") ? "polygon (area around its sites)" : wkt.slice(0, 60), note: certainty || undefined } : null;
		}).filter(Boolean);
		fact(kind === "region" ? "Area" : "Location", loc);
		const regions = [iri, ...places].flatMap((x) => iris(x, P("crm", "P89_falls_within"))).filter((x) => kindOf(x) === "region");
		used.add(P("crm", "P89_falls_within"));
		fact("Region", regions.map(link));
		fact("Part of", use(P("crm", "P46i_forms_part_of")).map(val));
		fact("Dated to (phase)", use(P("crm", "P8i_witnessed")).map(val));
		if (kind === "region") {
			const within = subs(iri, P("crm", "P89_falls_within")).flatMap((x) => (kindOf(x) === "site" ? [x] : subs(x, P("crm", "P53_has_former_or_current_location")).filter((s) => kindOf(s) === "site")));
			list("Sites in this region", [...new Set(within)].map(link));
		} else {
			const parts = subs(iri, P("crm", "P46i_forms_part_of")).filter((x) => kindOf(x) === "feature");
			list(kind === "site" ? "Features" : "Parts of this feature", parts.map(link));
			const finds = [
				...[iri, ...parts].flatMap((x) => subs(x, P("crmarchaeo", "AP21i_is_contained_in"))),
				...places.flatMap((pl) => subs(pl, P("crm", "P53_has_former_or_current_location"))).filter((x) => kindOf(x) === "find"),
			];
			list("Finds", [...new Set(finds)].map(link));
		}
	}

	if (kind === "period") {
		const ts = use(P("crm", "P4_has_time-span")).map((o) => o.value)[0];
		if (ts) fact("Time-span", [{ text: `${year(first(ts, P("crm", "P79_beginning_is_qualified_by")))} – ${year(first(ts, P("crm", "P80_end_is_qualified_by")))}`, note: "as given by the chronology system" }]);
		fact("Chronology system", use(P("skos", "inScheme")).map(val));
		fact("Part of (culture)", use(P("crm", "P9i_forms_part_of")).map(val));
		list("Contexts dated to this phase", subs(iri, P("crm", "P8i_witnessed")).map(link));
	}
	if (kind === "culture") list("Phases", use(P("crm", "P9_consists_of")).map(val));
	if (kind === "chronology") list("Phases in this system", subs(iri, P("skos", "inScheme")).filter((x) => kindOf(x)).map(link));

	if (kind === "type") {
		fact("Scheme", [...use(P("skos", "inScheme")), ...use(P("skos", "topConceptOf"))].map(val));
		fact("Broader", use(P("skos", "broader")).map(val));
		fact("Close match", use(P("skos", "closeMatch")).map(val));
		fact("Broad match", use(P("skos", "broadMatch")).map(val));
		list("Narrower", subs(iri, P("skos", "broader")).map(link));
		list("Records of this type", subs(iri, P("crm", "P2_has_type")).filter((x) => kindOf(x)).map(link));
	}

	if (kind === "lab") {
		fact("Same as", use(P("owl", "sameAs")).map(val));
		list("Analyses", subs(iri, P("crm", "P14_carried_out_by")).map(link));
	}
	if (kind === "person") {
		fact("Family name", use(P("foaf", "familyName")).map(lit));
		fact("Given name", use(P("foaf", "givenName")).map(lit));
		list("Publications", subs(iri, P("dcterms", "creator")).filter(isPublication).map(link));
	}
	if (kind === "journal") {
		fact("Title", use(P("dcterms", "title")).map(lit));
		list("Articles", subs(iri, P("dcterms", "isPartOf")).filter(isPublication).map(link));
	}

	fact("Documented in", use(P("crm", "P70i_is_documented_in")).map(val));

	// Everything not shown above, so no statement is hidden
	const other = [];
	for (const [p, os] of out.get(iri) || []) {
		if (used.has(p)) continue;
		for (const o of os) other.push([{ text: curie(p), code: true }, val(o)]);
	}
	if (other.length) sections.push({ heading: "Other statements", table: { head: ["Property", "Value"], rows: other } });

	return { iri, kind, kindLabel: KINDS[kind].singular, path: pathOf(iri), label: labelOf(iri) || iri.slice(ID.length), facts, sections };
}

const records = [];
for (const s of out.keys()) {
	const kind = kindOf(s);
	if (kind) records.push(makeView(s, kind));
}
records.sort((a, b) => collator.compare(a.label, b.label));
const byKind = Object.fromEntries(Object.keys(KINDS).map((k) => [k, records.filter((r) => r.kind === k)]));

// Publications (page /data/publications/<citation key>/)
const publications = [...out.keys()].filter(isPublication).map((iri) => {
	const docs = subs(iri, P("crm", "P70i_is_documented_in")).filter((x) => kindOf(x));
	const journal = iris(iri, P("dcterms", "isPartOf"))[0];
	const pages = [first(iri, P("prism", "startingPage")), first(iri, P("prism", "endingPage"))].filter(Boolean).join("–") || first(iri, P("prism", "pageRange"));
	return {
		iri, key: pubKey(iri), path: `/data/publications/${pubKey(iri)}/`,
		citation: citation(iri), title: first(iri, P("dcterms", "title")),
		authors: authorsOf(iri).map((a) => link(a.iri)), year: first(iri, P("fabio", "hasPublicationYear")),
		journal: journal ? link(journal) : null, volume: first(iri, P("prism", "volume")), pages,
		doi: first(iri, P("prism", "doi")), classes: types(iri).map(link),
		finds: sortLinks(docs.filter((x) => kindOf(x) === "find").map(link)),
		analyses: sortLinks(docs.filter((x) => kindOf(x) === "analysis").map(link)),
		other: sortLinks(docs.filter((x) => !["find", "analysis"].includes(kindOf(x))).map(link)),
	};
}).sort((a, b) => collator.compare(a.citation, b.citation));

for (const d of datasets) d.publication = publications.find((p) => p.key === d.key) || null;

export default { ID, KINDS, records, byKind, publications, datasets };
