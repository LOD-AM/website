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
import { Parser, Writer } from "n3";
import metadata from "./metadata.js";
import dataReleases from "./dataReleases.js";

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
	if (isPublication(iri)) return { href: `/data/publications/${pubKey(iri)}/`, text: `${citation(iri)}: ${first(iri, P("dcterms", "title"))}`, short: citation(iri) };
	if (iri.startsWith(ID) && labelOf(iri)) return { text: labelOf(iri), title: curie(iri) };  // local concept (knowledge-graph vocab)
	let m;
	if ((m = iri.match(/^http:\/\/vocab\.getty\.edu\/aat\/(\d+)$/))) return { href: iri, text: aatLabels[m[1]] ? `${aatLabels[m[1]]} (AAT)` : `AAT ${m[1]}`, short: aatLabels[m[1]], external: true };
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

// The site a feature belongs to (graves are part of their kurgan, the kurgan of the site)
function siteOfFeature(f, seen = new Set()) {
	if (seen.has(f)) return [];
	seen.add(f);
	return iris(f, P("crm", "P46i_forms_part_of")).flatMap((x) => (kindOf(x) === "site" ? [x] : kindOf(x) === "feature" ? siteOfFeature(x, seen) : []));
}
// Where a find was found and what dates it: its feature(s), site(s) and the phases of those
// contexts. Finds without a feature point to their site's place (CONVENTIONS "Finds without a feature").
function contextOf(find) {
	const features = iris(find, P("crmarchaeo", "AP21i_is_contained_in"));
	const atSite = iris(find, P("crm", "P53_has_former_or_current_location"))
		.flatMap((pl) => subs(pl, P("crm", "P53_has_former_or_current_location")).filter((s) => kindOf(s) === "site"));
	const sites = [...new Set([...features.flatMap((f) => siteOfFeature(f)), ...atSite])];
	const phases = [...new Set([...features, ...atSite].flatMap((c) => iris(c, P("crm", "P8i_witnessed"))))];
	return { features, sites, phases, withoutFeature: features.length === 0 };
}
// Results of an analysis (has output): element mass fractions and lead isotope ratios, each value
// as reported: the number, "< x" (upper limit), "not detected", or "–"
function resultsOf(analysis) {
	const elementRows = [], ratioRows = [];
	for (const m of iris(analysis, P("afx", "AFX_0000395"))) {
		const analyte = first(m, P("afx", "AFX_0002816"));
		const value = first(m, P("qudt", "numericValue"));
		const max = iris(m, P("afx", "AFX_0000331")).map((x) => first(x, P("qudt", "numericValue")))[0];
		const notDetected = iris(m, P("crm", "P2_has_type")).includes(ID + "not_detected");
		const shown = value != null ? { text: value, num: true } : max != null ? { text: `< ${max}`, num: true } : notDetected ? { text: "not detected", note: true } : { text: "–" };
		const unit = first(m, P("qudt", "unit"));
		if (types(m).includes(P("afr", "AFR_0002368"))) {
			const ref = first(m, P("afx", "AFX_0001550"));
			const key = `${wikidata.get(analyte) || curie(analyte)} / ${wikidata.get(ref) || curie(ref)}`;
			ratioRows.push({ key, sort: key, shown, cells: [{ text: key }, shown] });
		} else {
			const e = elements.get(analyte);
			const unitText = UNIT_LABELS[unit] || (unit ? curie(unit) : "");
			elementRows.push({ key: analyte, sort: e ? e.order : 999, shown, unit: unitText,
				head: e ? { text: e.symbol, title: e.label, href: analyte, external: true } : link(analyte),
				cells: [e ? { text: e.symbol, title: e.label, href: analyte, external: true } : link(analyte), shown, { text: unitText }] });
		}
	}
	elementRows.sort((a, b) => a.sort - b.sort);
	ratioRows.sort((a, b) => collator.compare(a.sort, b.sort));
	return { elementRows, ratioRows };
}

// Analyses of a find: sampling events (O3) of the find or its parts → sample (O5) → analysis (input)
function analysesOf(find) {
	const sampled = [find, ...iris(find, P("crm", "P46_is_composed_of"))];
	return [...new Set(sampled.flatMap((x) => subs(x, P("crmsci", "O3_sampled_from")))
		.flatMap((st) => iris(st, P("crmsci", "O5_removed")))
		.flatMap((smp) => subs(smp, P("afx", "AFX_0000399"))))];
}
// All features below a feature or site (graves in a kurgan in a site)
function featuresBelow(x, seen = new Set()) {
	return subs(x, P("crm", "P46i_forms_part_of")).filter((f) => kindOf(f) === "feature" && !seen.has(f) && seen.add(f))
		.flatMap((f) => [f, ...featuresBelow(f, seen)]);
}
const cell = (links) => (links.length === 1 ? links[0] : links.length ? { multi: links } : { text: "" });
const numberOf = (find) => iris(find, P("crm", "P1_is_identified_by")).map((i) => first(i, P("crm", "P190_has_symbolic_content"))).filter(Boolean)[0];
// Table of finds (website: planning#9): one row per find, values as in the data, sorted by
// feature and find number. A column that only repeats the page's own record (the type on a
// type page, the site on a site page) is left out.
function findsTable(finds, self) {
	const rows = finds.map((f) => {
		const c = contextOf(f);
		const sort = [short(c.features.map(link)), numberOf(f) || labelOf(f) || f].join(" ");
		return { sort, cells: [
			{ ...link(f), text: numberOf(f) || link(f).text, title: labelOf(f) || undefined },
			cell(iris(f, P("crm", "P2_has_type")).map(link)),
			cell(iris(f, P("crm", "P45_consists_of")).map((m) => ({ ...link(m), text: link(m).short || link(m).text }))),
			cell(c.features.map(link)),
			cell(c.sites.map(link)),
			cell(c.phases.map(link)),
			cell(analysesOf(f).map((a) => ({ ...link(a), text: (labelOf(a) || "analysis").split(" of ")[0] }))),
		] };
	}).sort((a, b) => collator.compare(a.sort, b.sort)).map((r) => r.cells);
	const head = ["Find", "Type", "Material", "Feature", "Site", "Phase (by context)", "Analyses"];
	const selfLabel = self ? labelOf(self) : null;
	const keep = head.map((_, i) => i === 0 || !rows.length || !rows.every((r) => !r[i].multi && r[i].text === selfLabel));
	return { head: head.filter((_, i) => keep[i]), rows: rows.map((r) => r.filter((_, i) => keep[i])), count: rows.length };
}
function featuresTable(features) {
	const rows = features.map((f) => ({ sort: labelOf(f) || f, cells: [
		link(f),
		cell(iris(f, P("crm", "P2_has_type")).map(link)),
		cell(iris(f, P("crm", "P46i_forms_part_of")).filter((x) => kindOf(x) === "feature").map(link)),
		cell(iris(f, P("crm", "P8i_witnessed")).map(link)),
	] })).sort((a, b) => collator.compare(a.sort, b.sort)).map((r) => r.cells);
	const head = ["Feature", "Type", "Part of", "Phase"];
	const keep = head.map((_, i) => i !== 2 || rows.some((r) => r[2].text !== ""));
	return { head: head.filter((_, i) => keep[i]), rows: rows.map((r) => r.filter((_, i) => keep[i])), count: rows.length };
}

// One short item of the summary line: the values of a fact, joined
const short = (values) => (values || []).map((v) => v.short || v.text).filter(Boolean).join(", ");
// Feature and site for the summary line, without the site if a feature's label already names it
// ("Arslantepe, unspecified context, Arslantepe VIC")
function shortContext(c) {
	const f = short(c.features.map(link));
	return [f, ...c.sites.map((x) => link(x).text).filter((t) => !f.includes(t))].filter(Boolean).join(", ");
}
// Drop summary items that an earlier item already contains (a phase named in a feature's label)
const dedupe = (items) => items.filter(Boolean).filter((x, i, a) => !a.slice(0, i).some((y) => y.includes(x)));

const FINDS_CAPTION = "Find number as in the source; the phase is that of the find's context (feature or site).";

// --- Views ------------------------------------------------------------------------------------
function makeView(iri, kind) {
	const used = new Set();                         // predicates shown (outgoing)
	const facts = [];                               // key facts: [{label, values:[{text, href?, lang?}]}]
	const tech = [];                                // technical details (names, classes, identifiers)
	const sections = [];                            // [{heading, list?:[links], table?:{head, rows}, tech?}]
	const use = (p) => { used.add(p); return objs(iri, p); };
	const fact = (label, values) => { if (values.length) facts.push({ label, values }); };
	const techFact = (label, values) => { if (values.length) tech.push({ label, values }); };
	const get = (label) => facts.find((f) => f.label === label)?.values;
	const list = (heading, links) => { if (links.length) sections.push({ heading, list: sortLinks(links) }); };
	const table = (heading, t, caption) => { if (t.rows.length) sections.push({ heading, caption, table: t, count: t.count }); };

	// Names: every label with its language
	const names = [...use(P("rdfs", "label")), ...use(P("skos", "prefLabel")), ...use(P("foaf", "name"))];
	if (names.length > 1) techFact("Names", names.map((l) => ({ text: l.value, lang: l.language || undefined, note: LANG_NAMES[l.language] || l.language })));
	techFact("Class", use(P("rdf", "type")).map(val));

	// Types and identifiers, the same for every kind
	fact("Type", use(P("crm", "P2_has_type")).map(val));
	const ids = use(P("crm", "P1_is_identified_by")).map((o) => {
		const content = first(o.value, P("crm", "P190_has_symbolic_content"));
		const t = iris(o.value, P("crm", "P2_has_type")).map((x) => link(x).text).join(", ");
		const isUrl = /^https?:\/\//.test(content || "");
		return { text: content || o.value, href: isUrl ? content : undefined, external: isUrl, note: t || undefined };
	});
	techFact("Identifiers", ids);
	techFact("Identifier", use(P("dcterms", "identifier")).map(lit));
	const notes = use(P("crm", "P3_has_note")).map(lit);  // shown after the kind's own facts
	let summary = [];                               // items of the line under the title (values only)

	if (kind === "find") {
		fact("Material", use(P("crm", "P45_consists_of")).map(val));
		used.add(P("crmarchaeo", "AP21i_is_contained_in"));
		used.add(P("crm", "P53_has_former_or_current_location"));
		const c = contextOf(iri);
		fact("Found in (feature)", c.features.map(link));
		fact(c.withoutFeature ? "Found at (site)" : "Site", c.sites.map(link));
		fact("Dated by its context to", c.phases.map(link));
		summary = [short(get("Type")), short(get("Material")), shortContext(c), short(get("Dated by its context to"))];
		fact("Parts", use(P("crm", "P46_is_composed_of")).map(val));
		fact("Part of", use(P("crm", "P46i_forms_part_of")).map(val));
		list("Analyses", analysesOf(iri).map(link));
	}

	if (kind === "analysis") {
		const samples = use(P("afx", "AFX_0000399")).map((o) => o.value);
		const objects = [...new Set(samples.flatMap((s) => subs(s, P("crmsci", "O5_removed"))).flatMap((st) => iris(st, P("crmsci", "O3_sampled_from"))))];
		fact("Sampled object", objects.map(link));
		// The object's context, as on its own page (a sample of a part: the part's whole)
		const finds = objects.flatMap((o) => (kindOf(o) === "find" ? [o] : iris(o, P("crm", "P46i_forms_part_of"))));
		const ctx = finds.map(contextOf);
		const ctxLinks = [...new Set(ctx.flatMap((x) => [...x.features, ...x.sites]))].map(link);
		fact("Context of the object", ctxLinks);
		fact("Dated by its context to", [...new Set(ctx.flatMap((x) => x.phases))].map(link));
		fact("Carried out by", use(P("crm", "P14_carried_out_by")).map(val));
		techFact("Sample", samples.map((s) => ({ text: labelOf(s) || curie(s) })));
		// Results (has output): element mass fractions and lead isotope ratios
		used.add(P("afx", "AFX_0000395"));
		const { elementRows, ratioRows } = resultsOf(iri);
		if (elementRows.length) sections.push({ heading: "Composition", caption: "Mass fractions as reported in the publication; “< x” = below x; “not detected” = looked for, not found. Copper is not given for copper-base objects; other elements not listed were not analysed.", table: { head: ["Element", "Value", "Unit"], numeric: [1], rows: elementRows.map((r) => r.cells) } });
		summary = [[elementRows.length && "Chemical composition", ratioRows.length && "Lead isotope ratios"].filter(Boolean).join(", "),
			ctx.map(shortContext).join("; "), short(get("Dated by its context to")), short(get("Carried out by"))];
		if (ratioRows.length) sections.push({ heading: "Lead isotope ratios", caption: "Ratios as reported (dimensionless).", table: { head: ["Ratio", "Value"], numeric: [1], rows: ratioRows.map((r) => r.cells) } });
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
		if (kind === "site") summary = [short(get("Type")), short(get("Region")), short(get("Location"))];
		if (kind === "feature") summary = [short(get("Type")), short([...new Set(siteOfFeature(iri))].map(link)), short(get("Dated to (phase)"))];
		if (kind === "region") {
			const within = subs(iri, P("crm", "P89_falls_within")).flatMap((x) => (kindOf(x) === "site" ? [x] : subs(x, P("crm", "P53_has_former_or_current_location")).filter((s) => kindOf(s) === "site")));
			list("Sites in this region", [...new Set(within)].map(link));
		} else {
			const parts = featuresBelow(iri);
			table(kind === "site" ? "Features" : "Parts of this feature", featuresTable(parts));
			const finds = [
				...[iri, ...parts].flatMap((x) => subs(x, P("crmarchaeo", "AP21i_is_contained_in"))),
				...places.flatMap((pl) => subs(pl, P("crm", "P53_has_former_or_current_location"))).filter((x) => kindOf(x) === "find"),
			];
			table("Finds", findsTable([...new Set(finds)], iri), FINDS_CAPTION);
		}
	}

	if (kind === "period") {
		const ts = use(P("crm", "P4_has_time-span")).map((o) => o.value)[0];
		if (ts) fact("Time-span", [{ text: `${year(first(ts, P("crm", "P79_beginning_is_qualified_by")))} – ${year(first(ts, P("crm", "P80_end_is_qualified_by")))}`, note: "as given by the chronology system" }]);
		fact("Chronology system", use(P("skos", "inScheme")).map(val));
		fact("Part of (culture)", use(P("crm", "P9i_forms_part_of")).map(val));
		list("Contexts dated to this phase", subs(iri, P("crm", "P8i_witnessed")).map(link));
		summary = [short(get("Time-span")), short(get("Part of (culture)")), short(get("Chronology system"))];
	}
	if (kind === "culture") list("Phases", use(P("crm", "P9_consists_of")).map(val));
	if (kind === "chronology") list("Phases in this system", subs(iri, P("skos", "inScheme")).filter((x) => kindOf(x)).map(link));

	if (kind === "type") {
		const schemes = [...new Set([...use(P("skos", "inScheme")), ...use(P("skos", "topConceptOf"))].map((o) => o.value))];
		fact("Scheme", schemes.map(link));
		fact("Broader", use(P("skos", "broader")).map(val));
		fact("Close match", use(P("skos", "closeMatch")).map(val));
		fact("Broad match", use(P("skos", "broadMatch")).map(val));
		list("Narrower", subs(iri, P("skos", "broader")).map(link));
		summary = [get("Broader") ? `narrower term of ${short(get("Broader"))}` : "", short(get("Scheme"))];
		const ofType = subs(iri, P("crm", "P2_has_type")).filter((x) => kindOf(x));
		table("Finds of this type", findsTable(ofType.filter((x) => kindOf(x) === "find"), iri), FINDS_CAPTION);
		list("Other records of this type", ofType.filter((x) => kindOf(x) !== "find").map(link));
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

	fact("Note (from the source)", notes);
	fact("Documented in", use(P("crm", "P70i_is_documented_in")).map(val));
	if (kind === "find" || kind === "analysis") summary.push(short(get("Documented in")));
	if (kind === "person") {
		const pubs = sections.find((x) => x.heading === "Publications")?.list;
		if (pubs) summary = [`author of ${short(pubs)}`];
	}
	// Other kinds (labs, journals, regions, cultures, chronology systems): no summary line;
	// their key facts are short enough
	summary = dedupe(summary);

	// Everything not shown above, so no statement is hidden
	const other = [];
	for (const [p, os] of out.get(iri) || []) {
		if (used.has(p)) continue;
		for (const o of os) other.push([{ text: curie(p), code: true }, val(o)]);
	}
	if (other.length) sections.push({ heading: "Other statements", tech: true, table: { head: ["Property", "Value"], rows: other } });

	const label = labelOf(iri) || iri.slice(ID.length);
	const description = `${KINDS[kind].singular}: ${label}${summary.length ? ". " + summary.join(" · ") : ""}`;
	return { iri, kind, kindLabel: KINDS[kind].singular, path: pathOf(iri), label, summary, description, facts, tech, sections };
}

// --- Per-record files and citation (planning#13) -------------------------------------------
// A record's own triples: the record and its helper nodes, whose IRIs continue the record's IRI
// (<record>/sample, <record>/as, <record>/time_span, ...). Same data as its page.
const ownQuads = (iri) => quads.filter((q) => q.subject.value === iri || q.subject.value.startsWith(iri + "/"));
function usedPrefixes(qs) {
	const terms = qs.flatMap((q) => [q.subject, q.predicate, q.object]).filter((t) => t.termType === "NamedNode").map((t) => t.value);
	const pre = { "": ID };
	for (const [p, ns] of Object.entries(NS)) if (terms.some((t) => t.startsWith(ns))) pre[p] = ns;
	return pre;
}
function turtleOf(iri) {
	const qs = ownQuads(iri);
	const w = new Writer({ prefixes: usedPrefixes(qs) });
	w.addQuads(qs);
	let text = "";
	w.end((err, result) => { if (err) throw err; text = result; });
	return `# ${labelOf(iri) || iri}\n# ${iri} · LOD-AM (${metadata.url}) · CC BY 4.0\n\n${text}`;
}
// JSON-LD with the same prefixes as the Turtle file: one node per subject, values as
// {"@id"} or {"@value", "@language" | "@type"}
function jsonldOf(iri) {
	const qs = ownQuads(iri);
	const pre = usedPrefixes(qs);
	const short = (t) => { for (const [p, ns] of Object.entries(pre)) if (p && t.startsWith(ns)) return `${p}:${t.slice(ns.length)}`; return t; };
	const nodes = new Map();
	for (const q of qs) {
		const id = q.subject.value;
		if (!nodes.has(id)) nodes.set(id, { "@id": id });
		const n = nodes.get(id);
		if (q.predicate.value === NS.rdf + "type" && q.object.termType === "NamedNode") { (n["@type"] ||= []).push(short(q.object.value)); continue; }
		const o = q.object.termType === "Literal"
			? (q.object.language ? { "@value": q.object.value, "@language": q.object.language }
				: q.object.datatype && q.object.datatype.value !== NS.xsd + "string" ? { "@value": q.object.value, "@type": short(q.object.datatype.value) } : { "@value": q.object.value })
			: { "@id": q.object.value };
		(n[short(q.predicate.value)] ||= []).push(o);
	}
	const context = Object.fromEntries(Object.entries(pre).filter(([p]) => p));
	return JSON.stringify({ "@context": context, "@graph": [...nodes.values()] }, null, 1) + "\n";
}
// "Cite this record": the LOD-AM release (version, DOI from _data/metadata.js, set at each
// release) and the publication the values come from
function citeOf(iri, kind) {
	const rel = metadata.release || {};
	const author = metadata.author.name.split(" ");
	const family = author.pop(), given = author.join(" ");
	const yearOf = (rel.date || new Date().toISOString()).slice(0, 4);
	const label = labelOf(iri) || iri;
	const pubs = iris(iri, P("crm", "P70i_is_documented_in")).filter(isPublication);
	const source = pubs.map((p) => citation(p) + (first(p, P("prism", "doi")) ? ` (https://doi.org/${first(p, P("prism", "doi"))})` : ""));
	const project = "LOD-AM – Linked Open Data for Ancient Metallurgy";
	const text = `${family}, ${given} (${yearOf}): ${label}. ${KINDS[kind].singular} in ${project}`
		+ (rel.version ? `, version ${rel.version}` : "") + `. ${iri}`
		+ (rel.doi ? `. https://doi.org/${rel.doi}` : "")
		+ (source.length ? `. Data from ${source.join("; ")}` : "") + ".";
	const key = `lodam_${kind}_${iri.split("/").pop().slice(0, 8)}`;
	const esc = (x) => x.replace(/[{}\\]/g, "");
	const bib = [
		`@misc{${key},`,
		`  author       = {${family}, ${given}},`,
		`  title        = {${esc(label)}},`,
		`  howpublished = {${KINDS[kind].singular} in ${project}},`,
		`  year         = {${yearOf}},`,
		rel.version ? `  version      = {${rel.version}},` : null,
		rel.doi ? `  doi          = {${rel.doi}},` : null,
		`  url          = {${iri}},`,
		source.length ? `  note         = {Data from ${esc(source.join("; "))}},` : null,
		`}`,
	].filter(Boolean).join("\n");
	return { text, bibtex: bib, release: rel.version ? { version: rel.version, doi: rel.doi } : null };
}

const records = [];
for (const s of out.keys()) {
	const kind = kindOf(s);
	if (kind) {
		const v = makeView(s, kind);
		const base = v.path.replace(/\/$/, "");
		v.files = { ttl: `${base}.ttl`, jsonld: `${base}.jsonld` };
		v.cite = citeOf(s, kind);
		records.push(v);
	}
}
records.sort((a, b) => collator.compare(a.label, b.label));
const byKind = Object.fromEntries(Object.keys(KINDS).map((k) => [k, records.filter((r) => r.kind === k)]));

// All analyses of a publication as published (planning#10): one row per analysis, one column
// per element or ratio that occurs; an empty cell = not analysed. Values exactly as on the
// analysis pages, nothing computed.
function resultsTables(analyses) {
	const num = (a) => first(a, P("dcterms", "identifier")) || labelOf(a) || a;
	const rows = analyses.map((a) => ({ a, r: resultsOf(a) })).sort((x, y) => collator.compare(num(x.a), num(y.a)));
	const object = (a) => objsOfAnalysis(a).map((f) => ({ ...link(f), text: numberOf(f) || link(f).text, title: labelOf(f) || undefined }));
	const build = (pick, headOf) => {
		const withData = rows.filter((x) => pick(x.r).length);
		const cols = new Map();
		for (const x of withData) for (const c of pick(x.r)) if (!cols.has(c.key)) cols.set(c.key, c);
		const order = [...cols.values()].sort((a, b) => (typeof a.sort === "number" ? a.sort - b.sort : collator.compare(a.sort, b.sort)));
		const units = [...new Set(order.map((c) => c.unit).filter(Boolean))];
		return {
			head: ["Analysis", "Object", ...order.map(headOf)],
			numeric: order.map((_, i) => i + 2),
			units,
			count: withData.length,
			rows: withData.map((x) => [
				{ ...link(x.a), text: num(x.a), title: labelOf(x.a) || undefined },
				cell(object(x.a)),
				...order.map((c) => {
					const v = pick(x.r).find((y) => y.key === c.key)?.shown || { text: "" };
					// "not detected" as "n.d." in these dense tables (explained in the caption)
					return v.text === "not detected" ? { text: "n.d.", note: true, title: "not detected" } : v;
				}),
			]),
		};
	};
	return {
		composition: build((r) => r.elementRows, (c) => c.head),
		ratios: build((r) => r.ratioRows, (c) => ({ text: c.key })),
	};
}
// Histograms of the reported element contents of a publication (planning#23, owner 2026-11-19:
// "histograms with a log10 scale of all present elements"). One per element, all on the same
// log10 axis (quarter-decade bins) and the same count axis, so the elements can be compared.
// Only reported numbers are plotted. "Not detected", upper limits ("< x") and 0 have no place
// on a log scale; they are counted next to the chart instead. The values themselves are not
// changed; the binning is only for drawing.
const BINS_PER_DECADE = 4;
function histogramsOf(analyses) {
	const byElement = new Map();
	for (const a of analyses) for (const r of resultsOf(a).elementRows) {
		if (!byElement.has(r.key)) byElement.set(r.key, { head: r.head, sort: r.sort, unit: r.unit, values: [], nd: 0, limit: 0, zero: 0 });
		const e = byElement.get(r.key);
		if (r.shown.text === "not detected") e.nd++;
		else if (r.shown.text.startsWith("<")) e.limit++;
		else if (Number(r.shown.text) > 0) e.values.push(Number(r.shown.text));
		else if (Number(r.shown.text) === 0) e.zero++;
	}
	const all = [...byElement.values()].flatMap((e) => e.values);
	if (!all.length) return null;
	const lo = Math.floor(Math.log10(Math.min(...all))), hi = Math.ceil(Math.log10(Math.max(...all)) + 1e-9);
	const nBins = (hi - lo) * BINS_PER_DECADE;
	const edge = (i) => 10 ** (lo + i / BINS_PER_DECADE);
	const fmt = (x) => Number(x.toPrecision(2)).toString();
	const elementsList = [...byElement.values()].sort((a, b) => a.sort - b.sort).map((e) => {
		const counts = new Array(nBins).fill(0);
		// small epsilon so values exactly on a decade (0.001) fall into the bin that starts there
		for (const v of e.values) counts[Math.min(nBins - 1, Math.floor((Math.log10(v) - lo) * BINS_PER_DECADE + 1e-9))]++;
		return { ...e, n: e.values.length, bins: counts.map((c, i) => ({ i, count: c, from: fmt(edge(i)), to: fmt(edge(i + 1)) })) };
	});
	const units = [...new Set(elementsList.map((e) => e.unit).filter(Boolean))];
	return { lo, hi, nBins, binsPerDecade: BINS_PER_DECADE, decades: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i),
		yMax: Math.max(...elementsList.flatMap((e) => e.bins.map((b) => b.count))), units, elements: elementsList };
}

// Lead isotope diagrams of a publication (owner, 2026-11-19): two scatterplots with the same X.
// ²⁰⁴Pb-based ratios when the publication reports them; otherwise the ²⁰⁶Pb-based ratios as
// reported. Ratios are never converted (e.g. 206/204 is not computed from 204/206).
const ISOTOPE_PLOTS = [
	{ x: "lead-206 / lead-204", ys: ["lead-207 / lead-204", "lead-208 / lead-204"] },
	{ x: "lead-208 / lead-206", ys: ["lead-207 / lead-206", "lead-204 / lead-206"] },   // only without 204-based data
];
const ratioLabel = (key) => key.replace(/lead-(\d+) \/ lead-(\d+)/, (_, a, b) => `${a}Pb/${b}Pb`);
function isotopePlotsOf(analyses) {
	const rows = analyses.map((a) => {
		const v = {};
		for (const r of resultsOf(a).ratioRows) if (r.shown.num && !r.shown.text.startsWith("<")) v[r.key] = Number(r.shown.text);
		return { a, v };
	}).filter((x) => Object.keys(x.v).length);
	if (!rows.length) return null;
	const has = (key) => rows.some((x) => key in x.v);
	const set = ISOTOPE_PLOTS.find((s) => has(s.x) && s.ys.some(has));
	if (!set) return null;
	const num = (a) => first(a, P("dcterms", "identifier")) || labelOf(a) || a;
	const plots = set.ys.filter(has).map((y) => ({
		x: set.x, y, xLabel: ratioLabel(set.x), yLabel: ratioLabel(y),
		points: rows.filter((r) => set.x in r.v && y in r.v).map((r) => {
			const objs = objsOfAnalysis(r.a);
			return { x: r.v[set.x], y: r.v[y], href: pathOf(r.a), analysis: num(r.a),
				object: objs.map((o) => numberOf(o) || labelOf(o) || "").join(", ") };
		}),
	}));
	return { basis: set === ISOTOPE_PLOTS[0] ? "204" : "206", plots };
}

// The object(s) an analysis sampled (analysis → sample → sampling event → object)
function objsOfAnalysis(a) {
	return [...new Set(iris(a, P("afx", "AFX_0000399")).flatMap((s) => subs(s, P("crmsci", "O5_removed"))).flatMap((st) => iris(st, P("crmsci", "O3_sampled_from"))))];
}

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
		summary: [citation(iri), journal ? labelOf(journal) || link(journal).text : null, pages ? `pp. ${pages}` : null].filter(Boolean),
		finds: sortLinks(docs.filter((x) => kindOf(x) === "find").map(link)),
		findsTable: findsTable(docs.filter((x) => kindOf(x) === "find")), findsCaption: FINDS_CAPTION,
		analyses: sortLinks(docs.filter((x) => kindOf(x) === "analysis").map(link)),
		results: resultsTables(docs.filter((x) => kindOf(x) === "analysis")),
		histograms: histogramsOf(docs.filter((x) => kindOf(x) === "analysis")),
		isotopePlots: isotopePlotsOf(docs.filter((x) => kindOf(x) === "analysis")),
		other: sortLinks(docs.filter((x) => !["find", "analysis"].includes(kindOf(x))).map(link)),
	};
}).sort((a, b) => collator.compare(a.citation, b.citation));

for (const d of datasets) {
	d.publication = publications.find((p) => p.key === d.key) || null;
	// First release of this publication (the oldest changelog entry naming it)
	d.released = [...dataReleases].reverse().find((r) => r.publications.includes(d.key))?.date || null;
	const docs = d.publication ? subs(d.publication.iri, P("crm", "P70i_is_documented_in")) : [];
	d.finds = docs.filter((x) => kindOf(x) === "find").length;
	d.analyses = docs.filter((x) => kindOf(x) === "analysis").length;
}
// Sites with their coordinates as in the data (schema.org Dataset spatialCoverage, maps)
const siteCoords = byKind.site.map((r) => {
	const pl = iris(r.iri, P("crm", "P53_has_former_or_current_location"))[0];
	const wkt = pl ? iris(pl, P("geo", "hasGeometry")).map((g) => first(g, P("geo", "asWKT")))[0] || "" : "";
	const m = wkt.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
	return { iri: r.iri, label: r.label, path: r.path, lon: m ? m[1] : null, lat: m ? m[2] : null };
});

// Base maps (planning#18): one relief image per 1x1 degree tile with released sites, made by
// scripts/map/build_maps.py (_data/siteMaps.json). Markers are placed here, in percent of the
// image (equirectangular, like the image), so the images don't change when sites are added.
const siteMapData = existsSync("_data/siteMaps.json") ? JSON.parse(readFileSync("_data/siteMaps.json", "utf8")) : { tiles: [], sources: [] };
const maps = siteMapData.tiles.map((t) => {
	const sites = siteCoords.filter((x) => x.lat != null && Number(x.lon) >= t.west && Number(x.lon) < t.east && Number(x.lat) >= t.south && Number(x.lat) < t.north)
		.map((x) => ({ ...x, left: (100 * (Number(x.lon) - t.west)) / (t.east - t.west), top: (100 * (t.north - Number(x.lat))) / (t.north - t.south) }));
	// scale bar: 10 km as a share of the image width (true scale at the tile's middle)
	return { ...t, sites, scaleKm: 10, scalePct: (100 * 10) / (t.kmPerDegreeLon * (t.east - t.west)),
		extent: `${t.south}–${t.north}° N, ${t.west}–${t.east}° E` };
});
for (const r of byKind.site) {
	const m = maps.find((t) => t.sites.some((x) => x.iri === r.iri));
	if (m) r.map = { ...m, sites: m.sites.map((x) => ({ ...x, current: x.iri === r.iri })) };
}

export default { ID, KINDS, records, byKind, publications, datasets, siteCoords, dataReleases, maps, mapSources: siteMapData.sources, turtleOf, jsonldOf };
