import { DateTime } from "luxon";

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
		return (tags || []).filter(tag => ["all", "posts"].indexOf(tag) === -1);
	});

	eleventyConfig.addFilter("sortAlphabetically", strings =>
		(strings || []).sort((b, a) => b.localeCompare(a))
	);

	// Get tag color for individual tag badges
	import { getTagColor, getTagStyle } from '../_data/tagColors.js';
	
	eleventyConfig.addFilter("getTagColor", (tag) => getTagColor(tag));
	eleventyConfig.addFilter("getTagStyle", (tag) => getTagStyle(tag).style);
}