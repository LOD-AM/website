import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

import pluginFilters from "./_config/filters.js";
import pluginShortcodes from "./_config/shortcodes.js";
import pluginCharts from "./_config/charts.js";
import metadata from "./_data/metadata.js";
import * as pagefind from "pagefind";
import path from "node:path";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {
  eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
    if (data.draft) {
      data.title = `${data.title} (draft)`;
    }
    if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
      return false;
    }
  });

  eleventyConfig
    .addPassthroughCopy({
      "./public/": "/"
    })
    .addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");

  // Released LOD-AM data (website#18): downloads at /data/<citation key>.ttl
  eleventyConfig.addPassthroughCopy({ "data/published": "data" });

  eleventyConfig.addPassthroughCopy("./css/**/*.css");
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/css/bootstrap.min.css": "/css/bootstrap.min.css",
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js": "/js/bootstrap.bundle.min.js",
    // SPARQL query editor (planning#22), self-hosted like Bootstrap; loaded only on /query/
    "node_modules/@zazuko/yasgui/build/yasgui.min.js": "/js/yasgui/yasgui.min.js",
    "node_modules/@zazuko/yasgui/build/yasgui.min.css": "/css/yasgui.min.css"
  });

  eleventyConfig.addWatchTarget("css/**/*.css");
  eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpg,jpeg,gif}");

  eleventyConfig.addBundle("css", {
    toFileDirectory: "dist",
    bundleHtmlContentFromSelector: "style",
  });

  eleventyConfig.addBundle("js", {
    toFileDirectory: "dist",
    bundleHtmlContentFromSelector: "script",
  });

  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preAttributes: { tabindex: 0 }
  });
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed/feed.xml",
    stylesheet: "pretty-atom-feed.xsl",
    collection: {
      name: "blog",
      limit: 10,
    },
    // Same values as the rest of the site (_data/metadata.js)
    metadata: {
      language: metadata.language,
      title: metadata.title,
      subtitle: metadata.description,
      base: metadata.url,
      author: {
        name: metadata.author.name
      }
    }
  });

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    // Keep SVGs as they are instead of rendering 1024 px AVIF/WebP copies
    svgShortCircuit: true,
    failOnError: false,
    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
      }
    },
    sharpOptions: {
      animated: true,
    },
  });

  // Site search (planning#17): Pagefind indexes the built pages after every build into
  // <output>/pagefind/. Only blog posts and record pages are indexed (data-pagefind-body);
  // the search runs in the visitor's browser against these files, with no other host.
  eleventyConfig.on("eleventy.after", async ({ directories }) => {
    const { index, errors } = await pagefind.createIndex({ forceLanguage: metadata.language });
    if (!index) throw new Error(`Pagefind: ${errors.join("; ")}`);
    const added = await index.addDirectory({ path: directories.output });
    if (added.errors.length) throw new Error(`Pagefind: ${added.errors.join("; ")}`);
    const written = await index.writeFiles({ outputPath: path.join(directories.output, "pagefind") });
    if (written.errors.length) throw new Error(`Pagefind: ${written.errors.join("; ")}`);
    await pagefind.close();
    console.log(`[pagefind] index written (${added.page_count} pages read; posts and records indexed)`);
  });

  eleventyConfig.addPlugin(pluginFilters);
  eleventyConfig.addPlugin(pluginShortcodes);
  eleventyConfig.addPlugin(pluginCharts);
  eleventyConfig.addPlugin(IdAttributePlugin);

};

export const config = {
  templateFormats: [
    "md",
    "njk",
    "html",
    "liquid",
    "11ty.js",
  ],
  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
  dir: {
    input: "content",
    includes: "../_includes",
    data: "../_data",
    output: "_site"
  },
};