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
    
    // Site-specific fallbacks - check BEFORE fetching
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
    
    // Extract OpenGraph image
    const ogImageMatch = html.match(/<meta property="og:image"[^>]*content="([^"]+)"/i);
    if (ogImageMatch) {
      console.log('[' + new Date().toISOString() + '] Found og:image: ' + ogImageMatch[1]);
      return ogImageMatch[1];
    }
    
    // Extract Twitter Card image as fallback
    const twitterImageMatch = html.match(/<meta name="twitter:image"[^>]*content="([^"]+)"/i);
    if (twitterImageMatch) {
      console.log('[' + new Date().toISOString() + '] Found twitter:image: ' + twitterImageMatch[1]);
      return twitterImageMatch[1];
    }
    
    // Dublin Core image
    const dcImageMatch = html.match(/<meta name="DC.identifier"[^>]*content="([^"]+)"/i);
    if (dcImageMatch) {
      return dcImageMatch[1];
    }
    
    // Schema.org image
    const schemaImageMatch = html.match(/<meta itemprop="image"[^>]*content="([^"]+)"/i);
    if (schemaImageMatch) {
      return schemaImageMatch[1];
    }
    
    // Extract favicon as last resort
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href="([^"]+)"/i);
    if (faviconMatch) {
      return faviconMatch[1];
    }
    
    // Try to find the first image in the page
    const imgMatch = html.match(/<img[^>]*src="([^"]+)"/i);
    if (imgMatch) {
      console.log('[' + new Date().toISOString() + '] Found first <img>: ' + imgMatch[1]);
      return imgMatch[1];
    }
    
    console.warn('[' + new Date().toISOString() + '] No image found for ' + url);
    return null;
  } catch (error) {
    // If fetch fails, check for site-specific fallback
    const hostname = new URL(url).hostname;
    if (hostname.includes('persee.fr')) {
      return 'https://www.persee.fr/img/persee-logo.png';
    }
    
    console.warn('[' + new Date().toISOString() + '] Error fetching ' + url + ': ' + error.message);
    return null;
  }
}

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {
  // Drafts, see also _data/eleventyDataSchema.js
  eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
    if (data.draft) {
      data.title = `${data.title} (draft)`;
    }

    if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
      return false;
    }
  });

  // Copy the contents of the 'public' folder to the output folder
  // For example, './public/css/' ends up in '_site/css/'
  eleventyConfig
    .addPassthroughCopy({
      "./public/": "/"
    })
    .addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");

  // Copy CSS files to output
  eleventyConfig.addPassthroughCopy("./css/**/*.css");

  // Copy Bootstrap CSS and JS to clean paths
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/css/bootstrap.min.css": "/css/bootstrap.min.css",
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js": "/js/bootstrap.bundle.min.js"
  });

  // Run Eleventy when these files change:
  // https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

  // Watch CSS files
  eleventyConfig.addWatchTarget("css/**/*.css");
  // Watch images for the image pipeline.
  eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpg,jpeg,gif}");

  // Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
  // Bundle <style> content and adds a {% css %} paired shortcode
  eleventyConfig.addBundle("css", {
    toFileDirectory: "dist",
    // Add all <style> content to 'css' bundle (use <style eleventy:ignore> to opt-out)
    // Supported selectors: https://www.npmjs.com/package/posthtml-match-helper
    bundleHtmlContentFromSelector: "style",
  });

  // Bundle <script> content and adds a {% js %} paired shortcode
  eleventyConfig.addBundle("js", {
    toFileDirectory: "dist",
    // Add all <script> content to the 'js' bundle (use <script eleventy:ignore> to opt-out)
    // Supported selectors: https://www.npmjs.com/package/posthtml-match-helper
    bundleHtmlContentFromSelector: "script",
  });

  // Official plugins
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

  // Image optimization
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

  // Filters
  eleventyConfig.addPlugin(pluginFilters);

  eleventyConfig.addPlugin(IdAttributePlugin);

  eleventyConfig.addShortcode("currentBuildDate", () => {
    return (new Date()).toISOString();
  });

  // Link Preview Shortcode
  // Usage: {% linkPreview "https://example.com" %}
  // Returns the OpenGraph image URL for the given URL
  eleventyConfig.addAsyncShortcode("linkPreview", async (url) => {
    const imageUrl = await getOpenGraphImage(url);
    return imageUrl || "/img/fallback-preview.svg";
  });

  // Link Preview Component Shortcode
  // Usage: {% linkPreviewCard "https://example.com", "Title" %}
  // Returns HTML for a link preview card
  eleventyConfig.addAsyncShortcode("linkPreviewCard", async (url, title = "") => {
    const imageUrl = await getOpenGraphImage(url);
    const fallbackImage = "/img/fallback-preview.svg";
    const displayUrl = new URL(url).hostname;
    const safeTitle = title || displayUrl;
    
    return `<a href="${url}" class="link-preview-card" style="display: block; text-decoration: none; color: inherit; margin: 1em 0;">
      <img src="${imageUrl || fallbackImage}" alt="${safeTitle}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 0.5em;" loading="lazy" />
      <div style="font-weight: bold;">${safeTitle}</div>
      <div style="color: #666; font-size: 0.9em;">${displayUrl}</div>
    </a>`;
  });

  // Academic Link Shortcode
  // Usage: {% academicLink "https://doi.org/10.1234/abc" %}
  // Usage: {% academicLink "https://doi.org/10.1234/abc", "Custom Title" %}
  // Returns HTML card with platform logo and paper title

  // Academic platform logos
  const academicLogos = {
    'doi.org': 'https://www.doi.org/assets/images/doi-logo.svg',
    'worldcat.org': 'https://worldcat.org/assets/images/worldcat-logo.svg',
    'zenodo.org': 'https://zenodo.org/static/img/logos/zenodo-gradient-round.svg',
    'jstor.org': 'https://www.jstor.org/images/jstor-logo.svg'
  };

  // Helper function to fetch DOI metadata
  async function getDOIMetadata(doiUrl) {
    try {
            const cleanDoi = doiUrl.replace(/^https?:\/\/doi.org\//i, '');
      
      // Try Crossref API first
      const crossrefUrl = 'https://api.crossref.org/works/' + encodeURIComponent(cleanDoi);
      const response = await fetch(crossrefUrl, {
        headers: {
          'User-Agent': 'LOD-AM/1.0 (https://lod-am.net)',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const title = data.message?.title?.[0] || data.message?.container_title?.[0] || cleanDoi;
        return { title, image: null };
      }
      
      // Fallback: try DOI resolution with citeproc+json
      const doiResolutionUrl = 'https://doi.org/' + encodeURIComponent(cleanDoi);
      const doiResponse = await fetch(doiResolutionUrl, {
        headers: {
          'Accept': 'application/citeproc+json'
        }
      });
      
      if (doiResponse.ok) {
        const data = await doiResponse.json();
        const title = data.title || cleanDoi;
        return { title, image: null };
      }
      
      return { title: cleanDoi, image: null };
    } catch (error) {
      console.warn('[' + new Date().toISOString() + '] Error fetching DOI metadata: ' + error.message);
      return { title: doiUrl, image: null };
    }
  }

  // Helper function for academic links
  async function getAcademicLinkData(url) {
    const hostname = new URL(url).hostname;
    
    for (const [domain, logo] of Object.entries(academicLogos)) {
      if (hostname.includes(domain)) {
        let title = '';
        let image = logo;
        
        if (domain === 'doi.org') {
          const metadata = await getDOIMetadata(url);
          title = metadata.title;
          image = logo;
        }
        
        return { title, image, platform: domain };
      }
    }
    
    return null;
  }

  eleventyConfig.addAsyncShortcode("academicLink", async (url, customTitle = null) => {
    const academicData = await getAcademicLinkData(url);
    const displayUrl = new URL(url).hostname;
    
    if (academicData) {
      const title = customTitle || academicData.title || displayUrl;
      const logo = academicData.image;
      
      return '<a href="' + url + '" class="link-preview-card academic-link" style="display: block; text-decoration: none; color: inherit; margin: 1em 0;">' +
        '<img src="' + logo + '" alt="' + academicData.platform + '" style="max-width: 200px; height: auto; border-radius: 8px; margin-bottom: 0.5em;" loading="lazy" />' +
        '<div style="font-weight: bold;">' + title + '</div>' +
        '<div style="color: #666; font-size: 0.9em;">' + displayUrl + '</div>' +
      '</a>';
    }
    
    // Fallback to generic academic icon
    const title = customTitle || displayUrl;
    return '<a href="' + url + '" class="link-preview-card academic-link" style="display: block; text-decoration: none; color: inherit; margin: 1em 0;">' +
      '<img src="/img/academic-icon.svg" alt="Academic Paper" style="max-width: 200px; height: auto; border-radius: 8px; margin-bottom: 0.5em;" loading="lazy" />' +
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