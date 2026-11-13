import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import EleventyFetch from "@11ty/eleventy-fetch";
import { readFileSync } from "node:fs";

import pluginFilters from "./_config/filters.js";

// How long fetched link previews and DOI titles are reused before refetching.
const FETCH_CACHE_DURATION = "4w";

// Escape text for use in HTML content and attribute values.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Helper function to fetch OpenGraph image from a URL
async function getOpenGraphImage(url) {
  try {
    const hostname = new URL(url).hostname;
    
    if (hostname.includes('persee.fr')) {
      return 'https://www.persee.fr/img/persee-logo.png';
    }
    
    // Cached in .cache/ (CI keeps it between runs): builds don't depend on
    // the remote page being reachable, and repeat builds give the same output.
    const html = await EleventyFetch(url, {
      duration: FETCH_CACHE_DURATION,
      type: "text",
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Eleventy Link Preview/1.0; +https://lod-am.net)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        signal: AbortSignal.timeout(15000)
      }
    });
    
    const ogImageMatch = html.match(/<meta property="og:image"[^>]*content="([^"]+)"/i);
    if (ogImageMatch) {
      console.log('[' + new Date().toISOString() + '] Found og:image: ' + ogImageMatch[1]);
      return ogImageMatch[1];
    }
    
    const twitterImageMatch = html.match(/<meta name="twitter:image"[^>]*content="([^"]+)"/i);
    if (twitterImageMatch) {
      console.log('[' + new Date().toISOString() + '] Found twitter:image: ' + twitterImageMatch[1]);
      return twitterImageMatch[1];
    }
    
    const dcImageMatch = html.match(/<meta name="DC.identifier"[^>]*content="([^"]+)"/i);
    if (dcImageMatch) {
      return dcImageMatch[1];
    }
    
    const schemaImageMatch = html.match(/<meta itemprop="image"[^>]*content="([^"]+)"/i);
    if (schemaImageMatch) {
      return schemaImageMatch[1];
    }
    
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href="([^"]+)"/i);
    if (faviconMatch) {
      return faviconMatch[1];
    }
    
    const imgMatch = html.match(/<img[^>]*src="([^"]+)"/i);
    if (imgMatch) {
      console.log('[' + new Date().toISOString() + '] Found first <img>: ' + imgMatch[1]);
      return imgMatch[1];
    }
    
    console.warn('[' + new Date().toISOString() + '] No image found for ' + url);
    return null;
  } catch (error) {
    const hostname = new URL(url).hostname;
    if (hostname.includes('persee.fr')) {
      return 'https://www.persee.fr/img/persee-logo.png';
    }
    
    console.warn('[' + new Date().toISOString() + '] Error fetching ' + url + ': ' + error.message);
    return null;
  }
}

// Helper function to fetch DOI title
async function getDOITitle(doiUrl) {
  try {
    const cleanDoi = doiUrl.replace(/^https?:\/\/doi.org\//i, '');

    const crossrefUrl = 'https://api.crossref.org/works/' + encodeURIComponent(cleanDoi);
    const data = await EleventyFetch(crossrefUrl, {
      duration: FETCH_CACHE_DURATION,
      type: "json",
      fetchOptions: {
        headers: {
          'User-Agent': 'LOD-AM/1.0 (https://lod-am.net)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      }
    });
    return data.message?.title?.[0] || data.message?.container_title?.[0] || cleanDoi;
  } catch (error) {
    console.warn('[' + new Date().toISOString() + '] Error fetching DOI title: ' + error.message);
    return doiUrl;
  }
}

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

  eleventyConfig.addPassthroughCopy("./css/**/*.css");
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/css/bootstrap.min.css": "/css/bootstrap.min.css",
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js": "/js/bootstrap.bundle.min.js"
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
    metadata: {
      language: "en",
      title: "Linked Open Data for Ancient Metallurgy",
      subtitle: "A sandbox project dedicated to ancient metallurgical & open data methodologies.",
      base: "https://lod-am.net/",
      author: {
        name: "Fabian Fricke"
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

  eleventyConfig.addPlugin(pluginFilters);
  eleventyConfig.addPlugin(IdAttributePlugin);

  // Bootstrap Icons, inlined from the npm package (no icon font, no CDN).
  // {% icon "house" %} is decorative; {% icon "house", "Home" %} gets a label.
  eleventyConfig.addShortcode("icon", (name, label = "") => {
    if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`invalid icon name: ${name}`);
    const svg = readFileSync(`node_modules/bootstrap-icons/icons/${name}.svg`, "utf8").trim();
    const a11y = label
      ? `role="img" aria-label="${escapeHtml(label)}"`
      : `aria-hidden="true" focusable="false"`;
    return svg.replace("<svg", `<svg ${a11y}`);
  });

  eleventyConfig.addShortcode("currentBuildDate", () => {
    return (new Date()).toISOString();
  });

  eleventyConfig.addAsyncShortcode("linkPreview", async (url) => {
    const imageUrl = await getOpenGraphImage(url);
    return imageUrl || "/img/fallback-preview.svg";
  });

  // Card linking to an external page. Inline elements only (<a>, <img>, <span>),
  // because Markdown wraps the shortcode output in a <p>; block elements such
  // as <div> inside it would split the link into several boxes.
  eleventyConfig.addAsyncShortcode("linkPreviewCard", async (url, title = "") => {
    const imageUrl = await getOpenGraphImage(url);
    const displayUrl = new URL(url).hostname;
    const safeTitle = title || displayUrl;
    return `<a href="${escapeHtml(url)}" class="link-card">` +
      `<img src="${escapeHtml(imageUrl || "/img/fallback-preview.svg")}" alt="" class="link-card__image" loading="lazy" eleventy:ignore>` +
      `<span class="link-card__title">${escapeHtml(safeTitle)}</span>` +
      `<span class="link-card__host">${escapeHtml(displayUrl)}</span>` +
    `</a>`;
  });

  // Card for literature, e.g. {% academicLink "https://doi.org/..." %}.
  // DOI titles come from Crossref; without network the DOI itself is shown.
  eleventyConfig.addAsyncShortcode("academicLink", async (url, customTitle = null) => {
    const displayUrl = new URL(url).hostname;
    let title = customTitle || displayUrl;
    if (url.includes("doi.org/")) {
      title = customTitle || (await getDOITitle(url)) || displayUrl;
    }
    return `<a href="${escapeHtml(url)}" class="link-card link-card--literature">` +
      `<img src="/img/literature-logo.svg" alt="" width="50" height="50" class="link-card__icon" eleventy:ignore>` +
      `<span class="link-card__title">${escapeHtml(title)}</span>` +
      `<span class="link-card__host">${escapeHtml(displayUrl)}</span>` +
    `</a>`;
  });
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