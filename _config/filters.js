import { DateTime } from "luxon";
import { getTagColor, getTagStyle } from '../_data/tagColors.js';
import series from '../_data/series.js';
import metadata from '../_data/metadata.js';
import topicData from '../_data/topicVocab.js';

export default function(eleventyConfig) {
	// Date filter for formatting dates with a format string
	// Usage: {{ dateObj | date("yyyy") }} or {{ "now" | date("yyyy-MM-dd") }}
	eleventyConfig.addFilter("date", (dateObj, format, zone) => {
		let dt;
		if (typeof dateObj === "string" && dateObj === "now") {
			dt = DateTime.now();
		} else if (dateObj instanceof Date) {
			dt = DateTime.fromJSDate(dateObj);
		} else if (typeof dateObj === "string") {
			dt = DateTime.fromISO(dateObj);
		} else {
			dt = DateTime.fromJSDate(dateObj);
		}
		
		if (zone) {
			dt = dt.setZone(zone);
		}
		
		return dt.toFormat(format || "yyyy-MM-dd");
	});

	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return the keys used in an object
	eleventyConfig.addFilter("getKeys", target => {
		return Object.keys(target);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		const collectionTags = ["all", "blog", "find", "site", "culture"];
		return (tags || []).filter(tag => !collectionTags.includes(tag));
	});

	eleventyConfig.addFilter("sortAlphabetically", strings =>
		(strings || []).sort((b, a) => b.localeCompare(a))
	);

	// Get tag color for individual tag badges
	eleventyConfig.addFilter("getTagColor", (tag) => getTagColor(tag));
	eleventyConfig.addFilter("getTagStyle", (tag) => getTagStyle(tag));

	// Series of a post: { series, index, parts } or null. `parts` are the posts
	// of the series (from the given collection) in reading order.
	eleventyConfig.addFilter("seriesOf", (posts, fileSlug) => {
		const s = series.find((x) => x.parts.includes(fileSlug));
		if (!s) return null;
		const parts = s.parts.map((slug) => (posts || []).find((p) => p.page.fileSlug === slug)).filter(Boolean);
		return { series: s, index: parts.findIndex((p) => p.page.fileSlug === fileSlug), parts };
	});
	eleventyConfig.addFilter("seriesById", (posts, id) => {
		const s = series.find((x) => x.id === id);
		if (!s) return null;
		const parts = s.parts.map((slug) => (posts || []).find((p) => p.page.fileSlug === slug)).filter(Boolean);
		return { series: s, index: -1, parts };
	});

	// schema.org JSON-LD (website#16). Returns a string that is safe inside
	// <script type="application/ld+json">.
	const absolute = (url) => new URL(url, metadata.url).href;
	const person = {
		"@type": "Person",
		"@id": absolute("/about/#me"),
		name: metadata.author.name,
		url: metadata.author.url,
		sameAs: metadata.author.sameAs || [],
	};
	const blog = { "@type": "Blog", "@id": absolute("/blog/#blog"), name: metadata.title + " (blog)", url: absolute("/blog/") };
	const toScript = (obj) => JSON.stringify(obj, null, 1).replace(/</g, "\\u003c");

	eleventyConfig.addFilter("jsonLdPost", (data, page, rawInput) => {
		const iso = (d) => new Date(d).toISOString().slice(0, 10);
		const dois = [...new Set([...(rawInput || "").matchAll(/academicLink\s+["'](https:\/\/doi\.org\/[^"']+)["']/g)].map((m) => m[1]))];
		const s = series.find((x) => x.parts.includes(page.fileSlug));
		const obj = {
			"@context": "https://schema.org",
			"@type": "BlogPosting",
			"@id": absolute(page.url) + "#post",
			headline: data.title,
			description: data.description,
			url: absolute(page.url),
			mainEntityOfPage: absolute(page.url),
			inLanguage: metadata.language,
			datePublished: iso(page.date),
			dateModified: iso(data.updated || page.date),
			keywords: topicsOf(data.topics, page.inputPath).map((t) => t.label),
			image: absolute("/img/logo.png"),
			author: person,
			isPartOf: s
				? [blog, { "@type": "CreativeWorkSeries", name: s.title, url: absolute("/blog/#" + s.id) }]
				: blog,
			license: "https://creativecommons.org/licenses/by/4.0/",
		};
		if (dois.length) obj.citation = dois.map((d) => ({ "@type": "ScholarlyArticle", "@id": d, url: d }));
		// about: the topics (as DefinedTerms of the LOD-AM topics scheme, sameAs Wikidata where exact)
		// and the LOD-AM records the post is about (front matter `about`)
		const about = [
			...topicsOf(data.topics, page.inputPath).map((t) => ({
				"@type": "DefinedTerm", "@id": t.iri, name: t.label, url: absolute(t.path),
				inDefinedTermSet: topicData.scheme,
				...(t.matches.some((m) => m.kind === "exactMatch") ? { sameAs: t.matches.filter((m) => m.kind === "exactMatch").map((m) => m.iri) } : {}),
			})),
			...(data.about || []).map((iri) => ({ "@id": iri })),
		];
		if (about.length) obj.about = about;
		return toScript(obj);
	});

	eleventyConfig.addFilter("jsonLdSite", () => toScript({
		"@context": "https://schema.org",
		"@graph": [
			{ "@type": "WebSite", "@id": absolute("/#website"), name: metadata.title, url: metadata.url,
			  description: metadata.description, inLanguage: metadata.language, author: { "@id": person["@id"] } },
			person,
			{ ...blog, author: { "@id": person["@id"] } },
		],
	}));

	// schema.org Dataset for /data/ (planning#15, for dataset search engines). Only values that
	// are in the data or the release metadata; nothing is derived from the data.
	eleventyConfig.addFilter("jsonLdDataset", (lodam) => {
		const rel = metadata.release || {};
		const dates = lodam.dataReleases.map((r) => r.date).sort();
		const obj = {
			"@context": "https://schema.org",
			"@type": "Dataset",
			"@id": absolute("/data/") + "#dataset",
			name: "LOD-AM: archaeometallurgical data on copper-base objects (released publications)",
			description: "Linked Open Data on ancient copper-base metal objects, their contexts and their chemical and lead isotope analyses, compiled from published sources and released one publication at a time. Values are given as reported in the source publications. Modelled in CIDOC CRM 7.1.3 with CRMsci and CRMarchaeo, the Allotrope Foundation Ontologies and FaBiO.",
			url: absolute("/data/"),
			license: "https://creativecommons.org/licenses/by/4.0/",
			isAccessibleForFree: true,
			inLanguage: metadata.language,
			creator: person,
			publisher: person,
			keywords: ["archaeometallurgy", "copper", "chemical composition", "lead isotopes", "Linked Open Data", "CIDOC CRM"],
			...(dates.length ? { datePublished: dates[0], dateModified: dates[dates.length - 1] } : {}),
			...(rel.version ? { version: rel.version } : {}),
			...(rel.doi ? { identifier: `https://doi.org/${rel.doi}`, sameAs: `https://doi.org/${rel.doi}` } : {}),
			distribution: lodam.datasets.map((d) => ({
				"@type": "DataDownload", name: `${d.key}.ttl`, contentUrl: absolute(d.file), encodingFormat: "text/turtle",
			})),
			citation: lodam.releasedPublications.map((p) => ({
				"@type": "ScholarlyArticle", name: p.title, ...(p.doi ? { "@id": `https://doi.org/${p.doi}`, url: `https://doi.org/${p.doi}` } : {}),
			})),
			spatialCoverage: lodam.siteCoords.filter((x) => x.lat && x.lon).map((x) => ({
				"@type": "Place", name: x.label, url: x.iri,
				geo: { "@type": "GeoCoordinates", latitude: Number(x.lat), longitude: Number(x.lon) },
			})),
		};
		return toScript(obj);
	});

	// Topics (website: controlled vocabulary from knowledge-graph data/vocab/topics.ttl).
	// Unknown names stop the build, so posts can only use topics of the vocabulary.
	function topicsOf(names, where = "") {
		return (names || []).map((n) => {
			const t = topicData.byName[n];
			if (!t) throw new Error(`Unknown topic "${n}" in ${where}: use a name from data/vocab/topics.ttl (without "topic_")`);
			return t;
		});
	}
	eleventyConfig.addFilter("topicsOf", (names, where) => topicsOf(names, where));
	eleventyConfig.addFilter("postsWithTopic", (posts, name) => (posts || []).filter((p) => (p.data.topics || []).includes(name)));
	eleventyConfig.addFilter("postsAbout", (posts, iri) => (posts || []).filter((p) => (p.data.about || []).includes(iri)));
	// Records named in a post's `about` must have a page (released data)
	eleventyConfig.addFilter("recordByIri", (records, iri, where = "") => {
		const r = (records || []).find((x) => x.iri === iri);
		if (!r) throw new Error(`"about" in ${where} names ${iri}, which is not in the released data`);
		return r;
	});
	// Post types (front matter `type`); unknown types stop the build
	const POST_TYPES = { "case-study": "Case study" };
	eleventyConfig.addFilter("postTypeLabel", (type, where = "") => {
		if (!type) return "";
		if (!POST_TYPES[type]) throw new Error(`Unknown post type "${type}" in ${where}: one of ${Object.keys(POST_TYPES).join(", ")}`);
		return POST_TYPES[type];
	});
}
