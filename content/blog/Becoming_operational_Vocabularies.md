---
title: Becoming Operational - Our Own Vocabularies, Linked to the AAT
description: Why LOD-AM now has local controlled vocabularies for object types, site and feature types and periods, and how they connect to the Getty AAT.
date: 2026-11-17
tags: ["vocabularies", "modelling"]
draft: true
---

In [The Vocabularies](/blog/The_vocabularies/) I chose the Getty AAT for object and feature types, and Pleiades and PeriodO for sites and periods. I still stand by that choice. But once we started working with real data, it became clear that I need something in between: **local controlled vocabularies** that say exactly what the sources say, and that are *linked* to the big vocabularies instead of being replaced by them.

### The typology: built on SAM

For the object types, I didn't start from scratch. I based the LOD-AM typology on the typology of the old **SAM project** (*Studien zu den Anfängen der Metallurgie*), as published by Krause in 2003, plus a few additions of my own. There is a simple reason for that: the SAM database will become **one of the most important sources** for LOD-AM. Its thousands of analyses of early metal objects are classified with exactly this typology. If LOD-AM speaks the same typological language, that data can come in without forcing it into categories it was never meant for.

> Rüdiger Krause, *Studien zur kupfer- und frühbronzezeitlichen Metallurgie zwischen Karpatenbecken und Ostsee* (Rahden/Westf. 2003).

The typology is a **SKOS concept scheme** with up to four levels. At the top are broad classes, such as *daggers and other blades*, *axes and adzes* or *elements of dress and jewellery*. Below them are type groups (*daggers*) and the types themselves (*flat dagger or dagger, unspecified*). All levels have English and German labels, and every object points to exactly one type.

### Connecting it to the AAT

So why not just use the AAT? Because the AAT and an archaeometallurgical typology answer different questions. The AAT knows *awls* and *chisels*, but not a *Maykop fork* or a *single-bladed shaft-hole axe*. If I simply replaced the type with the nearest AAT concept, I would lose exactly the information the typology was made for.

Instead, every concept that has a counterpart in the AAT is linked to it with one of two SKOS relations:

- `skos:closeMatch` when both mean (nearly) the same thing: our *awl* is a close match of AAT *awls*, our *bowl* of AAT *bowls (vessels)*.
- `skos:broadMatch` when the AAT concept is broader: our *single-bladed shaft-hole axe* has the broad match AAT *axes (tools)*, our *Maykop fork* AAT *forks (object genre)*.

Of the roughly 230 concepts in the typology, about a quarter are close matches, most others have a broad match, and only a few (like *unknown*) have none. Every AAT identifier was checked against the Getty SPARQL endpoint. That way you can ask LOD-AM for "all daggers" in AAT terms and still see every object with the precise type the publication gave it.

### Site and feature types

The same pattern works for sites and features. LOD-AM has its own small vocabulary of **site and feature types**: *settlement*, *hoard*, *grave*, *kurgan*, *layer*, and a few more. Again, each type is linked to the AAT where a fitting concept exists. Arslantepe, for example, is a *settlement* (close match: AAT *settlements*), the Palace Hoard a *hoard* (AAT *hoards (groupings)*), the Royal Tomb a *grave* (AAT *graves*).

### Periods

For periods, the local vocabulary follows the way PeriodO organises them. Every period definition belongs to the **chronology system** of its source, so that "Arslantepe VIA" always means Arslantepe VIA *as defined there*, with its own time-span (3350–3000 BC). The phases are grouped into **cultures**: Arslantepe VIA is a phase of the *Northern Mesopotamian Late Chalcolithic*, Arslantepe VIB1 of the *Northern Mesopotamian Early Bronze Age*. A context is always dated to a phase; the culture follows from it.

### What's next: Pleiades and PeriodO

Local vocabularies are not the end point, they're a bridge. The next step is to connect them to the gazetteers I chose at the very beginning:

- **Sites** will be linked to their **Pleiades** places. Where a site is still missing in Pleiades, I'll add it.
- **Periods** will go to **PeriodO**. Because our chronology systems are already organised the way PeriodO organises its collections, each of them can become one PeriodO collection.

Until then, the local vocabularies do their job: precise enough for the sources, and linked enough to be found.

As always, if you have thoughts, suggestions, or just want to talk vocabularies, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
