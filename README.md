# LOD-AM Website

The main website of the Linked Open Data for Ancient Metallurgy (LOD-AM) project

## About

This is the official website for the LOD-AM project, built with Eleventy static site generator and Bootstrap 5 for styling.

## Getting Started

### Installation

1. Clone the repository:
   git clone git@github.com:LOD-AM/Website.git
   cd Website

2. Install dependencies:
   npm install

3. Run the development server:
   npx @11ty/eleventy --serve

4. Open your browser to http://localhost:8080

### Build for Production

npx @11ty/eleventy

This will generate static files in the _site directory.

## Modifications History

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

## Legal Pages

This website includes legally required pages for German compliance:

- Impressum (/impressum/): Legal notice with contact information
- Privacy Policy (/privacy/): GDPR-compliant privacy statement

IMPORTANT: Replace placeholder text in both files with your actual personal information before deployment.

## Customization

### Colors
The site uses a custom LOD-AM color scheme with earthy tones:
- Primary: Earthy brown (#8B4513)
- Secondary: Dark olive green (#556B2F)
- Background: Dark (#121212)
- Text: Light (#e0e0e0)

To modify colors, edit css/bootstrap-theme.css.

### Tag Colors
Individual tags have custom colors defined in tagColors.js. Add new tags to the mapping.

### Logo
Replace public/img/logo.svg with your LOD-AM logo. The navbar automatically resizes it to 75x75px.


## Comments (Giscus)

This website uses **[Giscus](https://giscus.app/)** for blog post comments, powered by GitHub Discussions.

### Setup

1. **Install the Giscus GitHub App** on this repository:
   - Go to: [https://github.com/apps/giscus](https://github.com/apps/giscus)
   - Click "Install" and select the **LOD-AM/Website** repository

2. **Create a "Comments" category** in Discussions (optional but recommended):
   - Go to: [https://github.com/LOD-AM/Website/discussions/categories](https://github.com/LOD-AM/Website/discussions/categories)
   - Create a new category named "Comments"

### How It Works

- Each blog post automatically creates a linked GitHub Discussion thread
- Users can comment using their GitHub accounts
- Comments are stored in your repository's Discussions
- No tracking, privacy-friendly, and free

### Configuration

The Giscus script is configured in _includes/layouts/post.njk with:
- Repository: LOD-AM/Website
- Category: Comments
- Theme: Dark (matches the site's color scheme)
- Mapping: pathname (each post gets its own discussion)

## OpenGraph Images

Blog posts can display GitHub repository previews using **opengraph.githubassets.com**.

Example usage in markdown:

```markdown
<img src="https://opengraph.githubassets.com/1/LOD-AM/website" alt="LOD-AM/website" width="800" />
[View LOD-AM/website on GitHub](https://github.com/LOD-AM/website)
```

This generates a nice preview card of your GitHub repository directly in the blog post.


## Dependencies

- Eleventy (11ty) - Static site generator
- Bootstrap 5 - CSS framework
- @popperjs/core - Tooltip positioning

## License

This project is licensed under the MIT License.

## Links

- Repository: https://github.com/LOD-AM/Website
- Commits: https://github.com/LOD-AM/Website/commits/main
- Eleventy Docs: https://www.11ty.dev/
- Bootstrap Docs: https://getbootstrap.com/

Last updated: June 27, 2026 | Documentation version: 1.0