---
title: Becoming Operational - Arslantepe Is Online
description: The first complete dataset is live - all finds and analyses from Arslantepe published by Hauptmann et al. 2002, as Linked Open Data.
date: 2026-11-17
tags: ["data", "Arslantepe"]
draft: true
---

This is the post I’ve been waiting to write since the very beginning of LOD-AM: **the first complete dataset is online!** Every find and every analysis from Arslantepe published by Hauptmann, Schmitt-Strecker, Begemann and Palmieri in 2002 is now available as Linked Open Data—right here on this website, one page per record.

{% academicLink "https://doi.org/10.3406/paleo.2002.4745" %}

### Back to where it started

Arslantepe has been with LOD-AM from the start. Back in July, I [picked this very paper](/blog/The_first_example/) as my test case—because it throws pretty much every modelling problem of legacy data at you: fragments without types, one artifact with two samples, "not detected" values, and three different ID systems. It was a minefield. Now it’s no longer a test case. It’s the real thing.

### What’s in it

We collected the Arslantepe data directly from the publication and modelled it following the [conventions](/blog/Becoming_operational_Conventions/) and [vocabularies](/blog/Becoming_operational_Vocabularies/) from this series. Here’s what you get:

- **58 finds** (metal objects and casting waste), each with its type from the LOD-AM typology, linked to the Getty AAT;
- **78 analyses**: **50 chemical analyses** with 14 elements each, and **28 lead isotope analyses** by the Deutsches Bergbau-Museum Bochum with three lead isotope ratios each;
- **7 archaeological contexts**, among them the famous **Royal Tomb** with 38 of the finds, and the **Palace Hoard**;
- the **periods** they date to, from Arslantepe VII to VIC, each with its time-span and its culture.

And every value is exactly as the publication reported it. Where an element was looked for but not found, the data says "not detected"—not 0. Nothing is recalculated.

### Where to find it

- The [Data overview](/data/), with lists of all finds, analyses, contexts, periods and more.
- The [Arslantepe site page](/id/site/fc9ee3ea-41b1-4c3d-a174-d553b81bd6d8/), the [Royal Tomb](/id/feature/230027af-11bd-4fce-ac4d-39cd542cf78d/) and the [Palace Hoard](/id/feature/252b75ad-286f-4a5d-9b39-b340730e0869/).
- The [publication page](/data/publications/hauptmann2002chemical/), which brings all records of the article together.
- And the **whole dataset as RDF** (Turtle) for [download](/data/hauptmann2002chemical.ttl), under CC BY 4.0.

Every record has its own IRI under `https://lod-am.net/id/`. So you can cite and link a single find or a single analysis—not just the article.

### A word of thanks

I’m really proud of this one. Getting here meant many evenings of checking types, contexts, periods and values, and deciding, again and again, what the publication actually says. And I have to say it: I’m impressed by Claude’s performance along the way. It turned my decisions into a data model, a conversion and these pages, it caught inconsistencies I would have overlooked, and it never got tired of yet another round of checks. For a free-time project like mine, that made all the difference. But enough, that already sounds like advertisement, but it really worked....

### This is only the beginning

Arslantepe is the first dataset—but it won’t stay alone for long. The conventions, the vocabularies and the checks are in place now, and they work. That’s why I’m sure we’ll make **more data from many more publications** available soon.

Curious for the code behind the pages?

<img src="https://opengraph.githubassets.com/1/LOD-AM/website" alt="LOD-AM/website" width="800" />

[View LOD-AM/website on GitHub →](https://github.com/LOD-AM/website)

As always, if you have thoughts, suggestions, or find something in the data that doesn’t look right, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
