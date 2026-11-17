import { DateTime } from "luxon";
import { getTagColor, getTagStyle } from '../_data/tagColors.js';
import series from '../_data/series.js';
import metadata from '../_data/metadata.js';

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
			keywords: (data.tags || []).filter((t) => !["blog", "all"].includes(t)),
			image: absolute("/img/logo.png"),
			author: person,
			isPartOf: s
				? [blog, { "@type": "CreativeWorkSeries", name: s.title, url: absolute("/blog/#" + s.id) }]
				: blog,
			license: "https://creativecommons.org/licenses/by/4.0/",
		};
		if (dois.length) obj.citation = dois.map((d) => ({ "@type": "ScholarlyArticle", "@id": d, url: d }));
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
}
