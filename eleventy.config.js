import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

import pluginFilters from "./_config/filters.js";

// Helper function to fetch OpenGraph image from a URL
async function getOpenGraphImage(url) {
  try {
    const hostname = new URL(url).hostname;
    
    if (hostname.includes('persee.fr')) {
      return 'https://www.persee.fr/img/persee-logo.png';
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Eleventy Link Preview/1.0; +https://lod-am.net)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.warn('[' + new Date().toISOString() + '] HTTP ' + response.status + ' for ' + url);
      return null;
    }
    
    const html = await response.text();
    
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
    const response = await fetch(crossrefUrl, {
      headers: {
        'User-Agent': 'LOD-AM/1.0 (https://lod-am.net)',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.message?.title?.[0] || data.message?.container_title?.[0] || cleanDoi;
    }
    return cleanDoi;
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
    templateData: {
      eleventyNavigation: {
        key: "Feed",
        order: 4
      }
    },
    collection: {
      name: "posts",
      limit: 10,
    },
    metadata: {
      language: "en",
      title: "Blog Title",
      subtitle: "This is a longer description about your blog.",
      base: "https://example.com/",
      author: {
        name: "Your Name"
      }
    }
  });

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
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

  eleventyConfig.addShortcode("currentBuildDate", () => {
    return (new Date()).toISOString();
  });

  eleventyConfig.addAsyncShortcode("linkPreview", async (url) => {
    const imageUrl = await getOpenGraphImage(url);
    return imageUrl || "/img/fallback-preview.svg";
  });

  eleventyConfig.addAsyncShortcode("linkPreviewCard", async (url, title = "") => {
    const imageUrl = await getOpenGraphImage(url);
    const fallbackImage = "/img/fallback-preview.svg";
    const displayUrl = new URL(url).hostname;
    const safeTitle = title || displayUrl;
    
    return '<a href="' + url + '" class="link-preview-card" style="display: block; text-decoration: none; color: inherit; margin: 1em 0;">' +
      '<img src="' + (imageUrl || fallbackImage) + '" alt="' + safeTitle + '" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 0.5em;" loading="lazy" />' +
      '<div style="font-weight: bold;">' + safeTitle + '</div>' +
      '<div style="color: #666; font-size: 0.9em;">' + displayUrl + '</div>' +
    '</a>';
  });

  eleventyConfig.addAsyncShortcode("academicLink", async (url, customTitle = null) => {
    const displayUrl = new URL(url).hostname;
    let title = customTitle || displayUrl;
    
    if (url.includes('doi.org/')) {
      title = customTitle || (await getDOITitle(url)) || displayUrl;
    }
    
    return '<a href="' + url + '" class="link-preview-card academic-link" style="display: block; text-decoration: none; color: inherit; margin: 1em 0;">' +
      '<img src="/img/literature-logo.svg" alt="Literature" style="max-width: 200px; height: auto; border-radius: 8px; margin-bottom: 0.5em;" loading="lazy" />' +
      '<div style="font-weight: bold;">' + title + '</div>' +
      '<div style="color: #666; font-size: 0.9em;">' + displayUrl + '</div>' +
    '</a>';
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