---
title: Becoming Operational - The Conventions
description: From a hand-written example to rules that real data has to pass - the modelling conventions of LOD-AM.
date: 2026-11-17
tags: ["concept", "modelling"]
draft: true
---

My [first data example](/blog/Learning_by_Doing_My%20First_Data_Example/) was written by hand, one triple at a time. That's fine for learning, but it doesn't scale. As soon as you want to publish more than a handful of objects, you need **rules**: rules that say exactly how an object, a site, a period or an analysis is written down, and checks that refuse anything that breaks them.

That is what the last weeks were about. All rules now live in one place, the [CONVENTIONS.md](https://github.com/LOD-AM/knowledge-graph/blob/main/CONVENTIONS.md) in the knowledge graph repository. Here is what changed, and why.

### Fixed versions, checked terms

LOD-AM now uses **CIDOC CRM 7.1.3**, **CRMsci 3.2** for sampling and **CRMarchaeo 2.1.1** for finds in their archaeological contexts, together with **Allotrope (AFO)** for the analyses and **FaBiO** for the literature. Every term is checked automatically against the published ontologies, including the domains and ranges of the CRM properties, and the data is validated against SHACL shapes. If a term doesn't exist, the data doesn't go out.

That check already corrected my first example: `crm:P71_is_listed_in`, which I expected to be one of the most frequent properties, doesn't exist in CRM 7.1.3. Publications are now linked with `crm:P70i_is_documented_in`.

### One IRI per thing

Everything LOD-AM publishes lives under `https://lod-am.net/id/`, with the kind of thing in the path: `/id/site/…`, `/id/feature/…`, `/id/find/…`, `/id/analysis/…`, `/id/period/…` and so on, each followed by a stable identifier. Small helper nodes hang below their record, for example `/id/analysis/…/sample` or `/id/site/…/location`. Every main resource has a label in English and, where we have it, in German.

### Objects and their types

An object gets its type with the simple shortcut `crm:P2_has_type`, and that type is always a concept of **our own typology**. The Getty AAT is reached through that concept, not directly. Why this detour gets a whole post of its own: it's the next one in this series. The full `E17_Type_Assignment` from my first example is still allowed as an optional addition, but the shortcut is what every object must have.

### Contexts are dated, not objects

This one was an important decision: **we date the context, not the object.** A find sits in a feature (a hoard, a grave, a layer), and the feature witnessed a period (`crm:P8i_witnessed`). The object is placed in its feature with CRMarchaeo's `AP21i_is_contained_in`. A grave in a kurgan is part of the kurgan and of the site. Finds without a known feature point to the place of their site.

### Sites and places

Sites are `E27_Site`s with a GeoSPARQL geometry, so a triplestore can actually do spatial queries with them. They keep the **name as reported** in the publication next to their normalised labels, because that name is the link back to the literature. And when the coordinates only describe the vicinity or an area, the place says so.

When a site is linked to **Pleiades**, the Pleiades URI is an identifier of the site, not an `owl:sameAs`. A `sameAs` would merge everything Pleiades says about a place with everything we say about it, and that's a claim I don't want to make.

### Analyses as they were reported

On the scientific side, my first prototype needed the most corrections:

- The analysis takes a **sample**, and a sampling event (CRMsci) connects the sample to the object it was taken from. The AFO material class now sits on the sample, not on the object.
- Element contents in weight percent are **mass fractions**, not concentrations, with numeric values and QUDT units instead of strings.
- Upper limits ("< 0.001 %"), **"not detected"** and **"not analysed"** are three different things, and the data keeps them apart. "Not detected" is never written as 0.
- **Lead isotope ratios** name their two nuclides, using Wikidata, because neither ChEBI nor AFO covers all four lead isotopes.

And the most important rule of all: **values are published as reported.** Nothing is recalculated, normalised or rounded.

### Literature

Publications are FaBiO records with their DOI where there is one. They come from the LOD-AM library in my [public Zotero group](https://www.zotero.org/groups/6765723/lod-am/library), so the bibliography I work with and the bibliography in the knowledge graph are the same.

### Why all this effort?

Because the next step was real data. With the conventions in place and every rule checked automatically, a dataset is no longer something I craft by hand, it's something that has to pass. In the last post of this series, I'll show you the first one that did.

As always, if you have thoughts, suggestions, or just want to geek out about data modelling, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
