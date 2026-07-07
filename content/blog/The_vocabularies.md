---
title: The Vocabularies - Finding the Right Words for My Data
description: How I chose Pleiades, PeriodO, Getty AAT, Allotrope, and FABIO for LOD-AM.
date: 2026-06-30
tags: ["concept", "vocabularies"]
---

So, I’ve got my infrastructure sorted and my ontologies in place. But ontologies alone aren’t enough—I also needed **controlled vocabularies** to fill them with meaningful, consistent data. And since my research isn’t limited to the Mediterranean or the Near East, I needed vocabularies that could handle **global coverage** while still letting me add my own terms when needed.

### Pleiades: For Sites and Places

For archaeological sites, **Pleiades** was the obvious choice. It’s a community-driven gazetteer with a strong foundation in Classical studies, but it’s actively expanding to cover the whole ancient world. The best part? **I can add new sites myself**—critical for my work outside the traditional Mediterranean focus.

It’s not the most formal option out there, but it’s **open, linked, and practical**. And since it’s already widely used in digital humanities, it integrates well with CIDOC CRM.

### PeriodO: For Cultures and Periods

When it comes to **cultures and chronological periods**, I went with **PeriodO**. Why? Because it’s designed specifically for defining and linking time periods, and it supports **scholarly assertions**—meaning I can add my own period definitions when the existing ones don’t fit.

It’s not the most comprehensive vocabulary out there, but it’s **flexible, global, and RDF-native**. And unlike some other options, it doesn’t lock me into a specific region or timeframe.

### Getty AAT: For Feature and Object Types

For **feature and object types**, I chose the **Getty Art & Architecture Thesaurus (AAT)**. It’s the international standard, with over 30,000 terms covering everything from amphorae to weapons to architectural features. It’s comprehensive, multilingual, and—most importantly—**widely adopted**.

The trade-off? It’s not the easiest to extend. But for a global project like mine, the **interoperability** it offers far outweighs the occasional need to propose a new term or create a local extension.

### Allotrope Framework: For Scientific Analytics

For the **scientific side of things**, I needed a vocabulary that could handle chemical compositions, dating methods, and material analyses. The **Allotrope Framework Ontology (AFO)** fit the bill perfectly. It’s purpose-built for analytical chemistry and materials science, and it’s already used by major organizations in the field.

It’s not specifically designed for archaeology, but that’s okay—it’s **RDF-based, open-source, and it works**. And since I’m using it alongside CIDOC CRM, I can link my archaeological objects directly to their scientific results.

### FABIO: For Literature

Here’s where I made a slight pivot. In my last post, I mentioned FRBRoo for literature as an ontology. But after some more thought, I realized **FRBRoo is overkill** for my needs. I don’t plan to model literature entities in extreme depth—I just need something simple, like a Zenodo entry.

That’s why I switched to **FABIO (FRBR Aligned Bibliographic Ontology)**. It’s lightweight, FRBR-aligned, and perfect for tracking publications with basic metadata like titles, authors, dates, and DOIs. It’s not as comprehensive as FRBRoo, but it’s **a lot simpler**—and that’s exactly what I need, including **controlled vocabularies** for the those entries.

### The Big Picture

So here’s my vocabulary stack:
- **Pleiades** for sites
- **PeriodO** for cultures and periods
- **Getty AAT** for feature and object types
- **Allotrope Framework** for scientific analytics
- **FABIO** for literature

Together, they give me a **balance of global standards and flexibility**. Where comprehensive vocabularies exist (like Getty AAT and Allotrope), I use them. Where I need the ability to add custom entries (like Pleiades and PeriodO), I’ve chosen vocabularies that let me do just that.

Curious for the itty-bitty details?

<img src="https://opengraph.githubassets.com/1/LOD-AM/vocabularies" alt="LOD-AM/vocabularies" width="800" />

[View LOD-AM/vocabularies on GitHub →](https://github.com/LOD-AM/vocabularies)


As always, if you have thoughts, suggestions, or just want to talk vocabularies, you know where to find me: **info@lod-am.net** or (if you have a GitHub-Account) in a **comment** below.