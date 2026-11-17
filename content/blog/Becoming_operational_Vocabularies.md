---
title: Becoming Operational - Our Own Vocabularies, Linked to the AAT
description: Why LOD-AM now has local controlled vocabularies for object types, site and feature types and periods, and how they connect to the Getty AAT.
date: 2026-11-17
tags: ["vocabularies", "modelling"]
draft: false
---

So, back in [The Vocabularies](/blog/The_vocabularies/), I chose the Getty AAT for object and feature types, and Pleiades and PeriodO for sites and periods. I still stand by that choice. But the moment we started working with real data, I realised I needed something in between: **local controlled vocabularies** that say exactly what the sources say—and that are *linked* to the big vocabularies instead of being replaced by them.

### Why not just use the AAT?

Here’s the thing: the AAT and an archaeometallurgical typology answer different questions. The AAT knows *awls* and *chisels*. It doesn’t know a *Maykop fork* or a *single-bladed shaft-hole axe*. If I simply replaced every type with the nearest AAT concept, I’d throw away exactly the information the typology was made for.

It’s the knife-or-scissors problem from my [first data example](/blog/Learning_by_Doing_My%20First_Data_Example/) all over again: the words we use for objects carry the judgement of the people who classified them. A vocabulary that’s too coarse silently overwrites that judgement.

### The typology: built on SAM

For the object types, I didn’t start from scratch. The LOD-AM typology is based on the typology of the old **SAM project** (*Studien zu den Anfängen der Metallurgie*), as published by Krause in 2003, plus a few additions of my own:

> Rüdiger Krause, *Studien zur kupfer- und frühbronzezeitlichen Metallurgie zwischen Karpatenbecken und Ostsee* (Rahden/Westf. 2003).

Why SAM? Because the SAM database will become **one of the most important sources** for LOD-AM. Its thousands of analyses of early metal objects are classified with exactly this typology. If LOD-AM speaks the same typological language, that data can come in without being forced into categories it was never meant for.

One might say, that I am not free of bias in regards to Rüdiger Krause. That's correct. I studied Vor- und Frühgeschichte in the Goethe University Frankfurt and I have been a student of his for many years. He did a lot to put me on the path, which let me to this point and I am deeply thankful for that and for many other things. So he more than earned this little citation. 

The typology is a **SKOS concept scheme** with up to four levels. At the top are broad classes like *daggers and other blades*, *axes and adzes* or *elements of dress and jewellery*. Below them come type groups (*daggers*) and the types themselves (*flat dagger or dagger, unspecified*). Every concept has an English and a German label.

### Connecting it to the AAT

Instead of replacing our types with AAT concepts, every concept that has a counterpart in the AAT is **linked** to it, with one of two SKOS relations:

- `skos:closeMatch` when both mean (nearly) the same: our *awl* is a close match of AAT *awls*, our *bowl* of AAT *bowls (vessels)*.
- `skos:broadMatch` when the AAT concept is broader: our *single-bladed shaft-hole axe* has the broad match AAT *axes (tools)*, our *Maykop fork* AAT *forks (object genre)*.

Of the roughly 230 concepts in the typology, about a quarter are close matches, most others have a broad match, and only a handful (like *unknown*) have none. And yes—every single AAT identifier was checked against the Getty SPARQL endpoint. No invented IDs.

The best part? You can ask LOD-AM for "all daggers" in AAT terms and still get every object with the precise type the publication gave it. Global and local at the same time.

### Site and feature types

The same idea works for sites and features. LOD-AM has its own small vocabulary of **site and feature types**—*settlement*, *hoard*, *grave*, *kurgan*, *layer* and a few more—each linked to the AAT where a fitting concept exists. Arslantepe is a *settlement* (close match: AAT *settlements*), the Palace Hoard a *hoard* (AAT *hoards (groupings)*), the Royal Tomb a *grave* (AAT *graves*).

### Periods

For periods, I followed the way PeriodO organises them—and full transparency, after [missing PeriodO’s hierarchies at first](/blog/Learning_by_Doing_My%20First_Data_Example/), I was glad to finally get this right. Every period belongs to the **chronology system** of its source. "Arslantepe VIA" always means Arslantepe VIA *as defined there*, with its own time-span (3350–3000 BC). The phases are grouped into **cultures**: Arslantepe VIA is a phase of the *Northern Mesopotamian Late Chalcolithic*, Arslantepe VIB1 of the *Northern Mesopotamian Early Bronze Age*. A context is dated to a phase; the culture follows from it.

### What’s next: Pleiades and PeriodO

These local vocabularies aren’t the end point—they’re a bridge. Next, I’m going to connect them to the gazetteers I chose at the very beginning:

- **Sites** will be linked to their **Pleiades** places. Where a site is still missing in Pleiades, I’ll add it.
- **Periods** will go to **PeriodO**. Since our chronology systems are already organised the way PeriodO organises its collections, each of them can become one PeriodO collection.

Until then, the local vocabularies do their job: precise enough for the sources, and linked enough to be found.

Curious for the itty-bitty details?

<img src="https://opengraph.githubassets.com/1/LOD-AM/knowledge-graph" alt="LOD-AM/knowledge-graph" width="800" />

[View LOD-AM/knowledge-graph on GitHub →](https://github.com/LOD-AM/knowledge-graph)

As always, if you have thoughts, suggestions, or just want to talk vocabularies, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
