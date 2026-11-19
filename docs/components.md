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
| 4 | Sections | (in the page) | lists and value tables (composition, isotope ratios) with an explanatory caption |
| 5 | Blog posts about the record | (in the page) | posts whose `about` names the record |
| 6 | **Technical details** | `_includes/lodam/technical.njk` | IRI, names in all languages, classes, identifiers, sample, "Other statements" |
| 7 | Licence line | (in the page) | CC BY 4.0 and a link to the conventions |

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

## Technical details
`record.tech`, written with `techFact()`, plus sections marked `tech: true`. This holds what
linked-data users need but researchers don't look for first: the IRI (breaks after each `/` on
phones), names in every language, CIDOC CRM / AFO / FaBiO classes, identifiers and the sample.
"Other statements" lists every triple no other component shows, so nothing is hidden.

## Styles
`css/theme.css`, "Record header" and "Technical details": `.entity-kind`, `.entity-summary`,
`.entity-technical`, `.entity-iri`, plus `.entity-facts`, `.entity-list` and `.entity-table`.
Text colours meet WCAG AA on the page background (see the palette comments).
