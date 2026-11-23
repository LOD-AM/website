import { computeUpdated } from "../../_config/updates.js";

export default {
	tags: [
		"blog"
	],
	"layout": "layouts/post.njk",
	eleventyComputed: {
		// `updated:` checked and turned into a Date (website#17, _config/updates.js)
		updated: computeUpdated,
	},
};
