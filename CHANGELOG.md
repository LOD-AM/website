# Changelog

Notable changes to the LOD-AM website. Recent changes are described in the
pull requests on GitHub; this file keeps the history that used to be in the README.

## 2026-11: CI, deployment, accessibility, privacy, theme cleanup
- CI builds and checks every PR; `main` is deployed via the `deploy` branch (#10)
- Literature card fixed, WCAG AA contrast, keyboard and screen-reader fixes (#22)
- No third-party requests on page load: local icons, Giscus after a click,
  cached link previews and DOI titles (#23)
- One theme file on Bootstrap's dark mode; shortcodes in `_config/shortcodes.js`;
  feed metadata from `_data/metadata.js` (#24)

## 2026-06/07: initial site

### Major Changes Applied (June 24-27, 2026)

#### 1. Bootstrap 5 Integration (June 26, 2026)
- Installed Bootstrap 5 via npm (bootstrap, @popperjs/core)
- Added Bootstrap CSS and JavaScript to all layouts
- Configured passthrough copy for Bootstrap assets
- Updated all templates to use Bootstrap components (navbar, cards, buttons, badges, pagination, grid)
- Converted JavaScript front matter to YAML front matter in all templates
- Added Bootstrap Icons via CDN

Files Modified: All layout templates, eleventy.config.js, package.json, css/index.css

#### 2. Logo and Favicon (June 26, 2026)
- Added LOD-AM logo to navbar
- Added favicon support (.ico and .png)
- Created public/img/ directory for static assets
- Logo resized to 75x75px with max-width/max-height constraints

Files Modified: _includes/layouts/base.njk, public/img/logo.svg, public/img/favicon.ico

#### 3. Legal Compliance - German Pages (June 27, 2026)
- Created content/impressum.md - Legal notice page (required for German websites)
- Created content/privacy.md - GDPR-compliant privacy policy
- Added links to both pages in footer
- Excluded from main navigation (standard practice for legal pages)

Pages Available At:
- /impressum/ - Impressum (Legal notice)
- /privacy/ - Privacy Policy

Files Modified: content/impressum.md, content/privacy.md, _includes/layouts/base.njk

#### 4. Collection Renaming (June 26-27, 2026)
- Renamed collection from posts to blog for semantic clarity
- Updated all references in templates and configuration
- Renamed _includes/postslist.njk to _includes/bloglist.njk

Files Modified: eleventy.config.js, _includes/bloglist.njk, content/blog/blog.11tydata.js, content/blog.njk, _filters.js

#### 5. Theme and Styling (June 26-27, 2026)
- Created custom css/bootstrap-theme.css with LOD-AM colors
- Applied earthy/archaeological color scheme (Primary: #8B4513, Secondary: #556B2F)
- Converted to dark theme with proper contrast
- Applied bold font weights (body: 500, headings: 700)
- Added individual tag colors using tagColors.js
- Fixed date text color, button colors, and various CSS issues

Files Modified: css/bootstrap-theme.css, css/index.css, _includes/layouts/base.njk, tagColors.js, _filters.js

### Statistics

- Total Commits: 60+
- Files Modified: 25+
- Period: June 24-27, 2026

### By Category:
- Bootstrap Integration: 25+ commits (42%)
- Styling and Theme: 18 commits (30%)
- Logo and Branding: 8 commits (13%)
- Legal Compliance: 3 commits (5%)
- Collection Renaming: 6 commits (10%)
