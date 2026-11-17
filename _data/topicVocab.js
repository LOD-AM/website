// LOD-AM topics (global data "topicVocab"; posts use the front matter field "topics") (knowledge-graph data/vocab/topics.ttl, copied to data/vocab/): the controlled
// vocabulary for blog posts. Posts name topics in front matter (`topics: ["archaeometallurgy"]`,
// the local name without "topic_"); an unknown name fails the build (_config/filters.js).
// Pages: /topics/ (overview) and /topics/<slug>/; the topic IRI /id/topic_<name> redirects there.
import { readFileSync } from "node:fs";
import { Parser } from "n3";

const SKOS = "http://www.w3.org/2004/02/skos/core#";
const ID = "https://lod-am.net/id/";
const WD = "http://www.wikidata.org/entity/";
const quads = new Parser().parse(readFileSync("data/vocab/topics.ttl", "utf8"));
const wdLabels = new Map(readFileSync("data/vocab/wikidata.tsv", "utf8").split("\n")
	.filter((l) => l && !l.startsWith("#")).map((l) => l.split("\t")).map(([id, label]) => [WD + id, label]));

const by = (s, p) => quads.filter((q) => q.subject.value === s && q.predicate.value === SKOS + p).map((q) => q.object);
const lit = (s, p, lang) => by(s, p).find((o) => o.language === lang)?.value;

const iris = [...new Set(quads.filter((q) => q.predicate.value === SKOS + "inScheme" && q.object.value === ID + "topics").map((q) => q.subject.value))];
const MATCH = { exactMatch: "same as", closeMatch: "close to", broadMatch: "narrower than" };

const topics = iris.map((iri) => {
	const name = iri.slice(ID.length + "topic_".length);
	return {
		iri, name, slug: name.replace(/_/g, "-"), path: `/topics/${name.replace(/_/g, "-")}/`,
		idPath: `/id/topic_${name}/`,
		label: lit(iri, "prefLabel", "en"), labelDe: lit(iri, "prefLabel", "de"),
		altLabels: by(iri, "altLabel").filter((o) => o.language === "en").map((o) => o.value),
		scopeNote: lit(iri, "scopeNote", "en"),
		broader: by(iri, "broader").map((o) => o.value),
		related: by(iri, "related").map((o) => o.value),
		matches: Object.keys(MATCH).flatMap((m) => by(iri, m).map((o) => ({ kind: m, relation: MATCH[m], iri: o.value, label: wdLabels.get(o.value) || o.value.split("/").pop(), qid: o.value.split("/").pop() }))),
	};
}).sort((a, b) => a.label.localeCompare(b.label, "en"));

const byName = Object.fromEntries(topics.map((t) => [t.name, t]));
const byIri = Object.fromEntries(topics.map((t) => [t.iri, t]));
for (const t of topics) {
	t.broaderTopics = t.broader.map((i) => byIri[i]).filter(Boolean);
	t.narrowerTopics = topics.filter((x) => x.broader.includes(t.iri));
	t.relatedTopics = t.related.map((i) => byIri[i]).filter(Boolean);
}
const top = topics.filter((t) => !t.broader.length);

export default { scheme: ID + "topics", topics, byName, top };
