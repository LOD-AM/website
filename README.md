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
   npm start

4. Open your browser to http://localhost:8080

### Build and check

npm run build    # static files in _site/
npm run check    # sanity checks on _site/ (required files, posts, internal links)

### Deployment

Every push to `main` is built and checked by GitHub Actions and, if everything passes,
published to the `deploy` branch, which the web server pulls via webhook.
See [docs/deployment.md](docs/deployment.md).

## Changes

See [CHANGELOG.md](CHANGELOG.md) and the pull requests on GitHub.

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

To modify colors, edit the palette at the top of `css/theme.css` (check WCAG AA contrast, see CLAUDE.md).

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
- Mapping: title (each post gets its own discussion; don't rename published posts)

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

This repository uses **dual licensing**:

### Content License (CC-BY-4.0)
All original content created by Fabian Fricke and the LOD-AM project (markdown files, text, images in /content/ and /public/img/) is licensed under **Creative Commons Attribution 4.0 International (CC-BY-4.0)**.

<a href="https://github.com/LOD-AM/website">LOD-AM Website</a> &copy; 2026 by <a href="https://lod-am.net">Fabian Fricke</a> is licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">

**Attribution Requirements:**
- Give appropriate credit to "Fabian Fricke / LOD-AM Project"
- Provide a link to the license: https://creativecommons.org/licenses/by/4.0/
- Indicate if changes were made
- Retain any existing copyright notices

### Code License (MIT)
The code (Eleventy configuration, templates, JavaScript) and third-party dependencies retain their original licenses:
- Eleventy static site generator (MIT License)
- Bootstrap 5 (MIT License)
- Popper.js (MIT License)
- All npm dependencies (see package.json for individual licenses)

**Note:** Legal documents (content/impressum.md, content/privacy.md) are required for German website compliance and are NOT subject to CC-BY-4.0.

For full license details, see the [LICENSE](LICENSE) file.

## Links

- Repository: https://github.com/LOD-AM/Website
- Commits: https://github.com/LOD-AM/Website/commits/main
- Eleventy Docs: https://www.11ty.dev/
- Bootstrap Docs: https://getbootstrap.com/
- CC-BY-4.0 License: https://creativecommons.org/licenses/by/4.0/

Last updated: July 10, 2026 | Documentation version: 1.1