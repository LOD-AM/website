# Components of the data pages

The record pages (`/id/<kind>/<uuid>/`, `content/id/entity.njk`) and publication pages
(`/data/publications/<key>/`, `content/data/publication.njk`) are built from a few
components. New kinds of pages use them too, so every record looks the same.
The data comes from `_data/lodam.js`. Nothing on these pages is calculated from the
data: values appear exactly as reported.

Each page shows its parts in this order. Visitors look first for what a record is,
where and when it is from, and where it was published. The modelling comes last.

| Order | Component | Include | Content |
|---|---|---|---|
| 1 | Breadcrumb | (in the page) | `Data › <kind list>` |
| 2 | **Record header** | `_includes/lodam/header.njk` | kind (small caps), title (`<h1>`), summary line |
| 3 | **Key facts** | `_includes/lodam/facts.njk` | `<dl>` of what researchers look for, per kind |
| 4 | Sections | `_includes/lodam/table.njk` | tables of finds and features, value tables (composition, isotope ratios), short lists; each with a caption explaining how to read it |
| 5 | Blog posts about the record | (in the page) | posts whose `about` names the record |
| 6 | **Cite and download** | `_includes/lodam/cite.njk` | citation (text, BibTeX), Turtle and JSON-LD of the record |
| 7 | **Technical details** | `_includes/lodam/technical.njk` | IRI, names in all languages, classes, identifiers, sample, "Other statements" |
| 8 | Licence line | (in the page) | CC BY 4.0 and a link to the conventions |

## Record header
- **Kind**: `record.kindLabel` ("Find", "Analysis", …) above the title.
- **Title**: the record's English label (`labelOf`).
- **Summary line**: `record.summary`, a few short values joined by " · ", for example
  `awl · copper and copper alloy · Royal Tomb, Arslantepe · Arslantepe VIB1 · Hauptmann et al. 2002`.
  It is built from values that are already on the page (the `short` text of a link: the
  citation for a publication, the AAT label without "(AAT)"), never from computed ones.
  Defined per kind in `makeView`. Kinds whose key facts are short anyway have no summary line.
  The summary also becomes the page's `<meta name="description">`.

## Key facts
`record.facts`: `[{ label, values: [{ text, href?, lang?, note? }] }]`, written with `fact()` in
`makeView` and rendered with `_includes/lodam/value.njk`. They are ordered by what a researcher
asks: what it is (type, material), where (feature, site), when (phase), by whom (lab),
where published (publication). Labels are plain English ("Found in (feature)"), not property names.

## Value tables
`sections[]` with `table: { head, rows, numeric }`. Numbers are right-aligned in monospace, and
"not detected" is in italics. The caption states how to read the values (units, "< x",
"not detected", what was not analysed). Phones scroll a wide table inside its own container
(`.table-responsive`).

## Tables of finds and features
`findsTable()` and `featuresTable()` in `_data/lodam.js`, rendered with `_includes/lodam/table.njk`
(cells with several values via `_includes/lodam/cell.njk`). They are used on site, feature, type and
publication pages instead of long lists. There is one row per record, sorted by feature and find
number, and the first cell is the row header. A column that only repeats the page's own record (the
site on a site page) is left out. Values come from the data; the phase is the phase of the find's
context. The tables don't sort or filter on the client: the page works without JavaScript.

## Analyses of a publication
`/data/publications/<key>/analyses/` (`content/data/publication-analyses.njk`, `resultsTables()` in
`_data/lodam.js`) has one table for chemical composition and one for lead isotope ratios. There is one
row per analysis, and the columns are the elements or ratios that occur. The values come from the same
function as the analysis pages (`resultsOf()`), and an empty cell means not analysed. In these dense
tables only, "not detected" is written "n.d." (explained in the caption, full term as a tooltip). The
analysis number stays visible while the table scrolls sideways.

## Cite and download
`record.cite` (`citeOf()` in `_data/lodam.js`): author, year, label, kind, the project, the release
version and DOI from `_data/metadata.js` → `release` (set them at each release; each release gets a
Zenodo DOI), the IRI and the publication the values come from. Shown as text and BibTeX.
Downloads: `/id/<kind>/<uuid>.ttl` and `.jsonld` (`content/id/entity-ttl.11ty.js`,
`entity-jsonld.11ty.js`) hold the record and its helper nodes (IRIs that continue the record's IRI),
the same data as the page. They are also linked in the page head (`rel="alternate"`). `npm run check`
checks that they exist, parse and hold the right number of triples.

## Charts
Static SVG built at build time by `_config/charts.js`, with no JavaScript and no chart library.
Histograms of element contents (planning#23) appear on the analyses page of a publication; their data
comes from `histogramsOf()` in `_data/lodam.js`. There is one chart per element, all on the same
log10 axis (four bins per power of ten), with a count axis per chart. "Not detected", "< x" and 0
are counted next to the chart, not plotted. Each bar has a native tooltip (`<title>`), each chart a
text alternative, and a table view sits in a `<details>`. There is one mark colour per mode
(`--lodam-chart-bar`), checked with the dataviz palette validator (lightness band for marks, 3:1 on the
chart surface). Text uses text colours, never the mark colour.

Lead isotope diagrams (owner, 2026-11-19) appear on the same page and come from `isotopePlotsOf()` and
`scatterSvg()`. There are two scatterplots with a shared X axis: ²⁰⁶Pb/²⁰⁴Pb against ²⁰⁷Pb/²⁰⁴Pb and
²⁰⁸Pb/²⁰⁴Pb. Only when a publication has no ²⁰⁴Pb-based ratios, X is ²⁰⁸Pb/²⁰⁶Pb and Y is ²⁰⁷Pb/²⁰⁶Pb
and ²⁰⁴Pb/²⁰⁶Pb (`ISOTOPE_PLOTS` in `_data/lodam.js`). Ratios are plotted as reported and never converted.
Each point links to its analysis, with a tooltip.

## Site maps
`_includes/lodam/map.njk` shows a static relief map with the site markers on site pages and on
`/data/sites/`. The images come from `scripts/map/build_maps.py`, one per 1° × 1° tile that contains a
released site (owner, 2026-11-19). They use a Copernicus GLO-90 hillshade with an earthy elevation
tint, HydroRIVERS rivers (smoothed for drawing), and Natural Earth lakes, reservoirs and sea, with no
borders, places or roads. `lodam.maps` in `_data/lodam.js` places the markers in percent of the image
(equirectangular, like the image), so adding a site to an existing tile needs no new image. Markers and
labels are HTML (readable at any width) in fixed colours, because the image is the same in both modes.
The scale bar is true at the tile's middle latitude. Full attributions are on `/data/#map-sources`.

## Technical details
`record.tech`, written with `techFact()`, plus sections marked `tech: true`. This holds what
linked-data users need but researchers don't look for first: the IRI (breaks after each `/` on
phones), names in every language, CIDOC CRM / AFO / FaBiO classes, identifiers and the sample.
"Other statements" lists every triple no other component shows, so nothing is hidden.

## Styles
`css/theme.css`, "Record header" and "Technical details": `.entity-kind`, `.entity-summary`,
`.entity-technical`, `.entity-iri`, plus `.entity-facts`, `.entity-list` and `.entity-table`.
Text colours meet WCAG AA on the page background in dark and light mode (see the palette comments;
`npm run qa` audits both). Use the theme tokens (`--lodam-chalk-white` = strong text,
`--lodam-charcoal` = surface, `--lodam-stripe`, `rgba(var(--lodam-line-rgb), a)` for lines) rather
than fixed colours, so a component works in both modes. Numbers in tables use `.entity-num`
(tabular figures), and in wide tables only the first column's links use the accent colour.
