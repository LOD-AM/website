---
title: Becoming Operational - The Conventions
description: From a hand-written example to rules that real data has to pass - the modelling conventions of LOD-AM.
date: 2026-11-17
tags: ["concept", "modelling"]
draft: true
---

So, my [first data example](/blog/Learning_by_Doing_My%20First_Data_Example/) was written by hand, one triple at a time. That’s great for learning—but it doesn’t scale. As soon as you want to publish more than a handful of objects, you need **rules**. Rules that say exactly how an object, a site or an analysis is written down, and checks that refuse anything that breaks them.

That’s what the last weeks were about. All those rules now live in one place: the **conventions** of the knowledge graph. I won’t walk you through all of them here (that would be a very long and very boring post). Instead, here are three decisions that taught me something—and one confession.

### The confession first

Remember when I wrote that `crm:P71_is_listed_in` might end up being one of the most frequent properties in the whole triple store? Well. It doesn’t even exist in CIDOC CRM 7.1.3. Neither did a few other things in my first prototype.

That’s why every term in LOD-AM is now **checked automatically** against the published ontologies—CIDOC CRM 7.1.3, CRMsci, CRMarchaeo, Allotrope and FaBiO—including whether a property is even allowed between the two things it connects. On top of that, the data is validated against SHACL shapes. If a term doesn’t exist, the data doesn’t go out. Publications are now linked with `crm:P70i_is_documented_in`, by the way.

### 1. We date the context, not the object

Here’s a question that sounds simple: how old is a dagger? In most publications, the honest answer is: we don’t know how old the *dagger* is. We know how old the **grave** is that it was found in.

So that’s what LOD-AM says. The object sits in its context—a grave, a hoard, a layer—using CRMarchaeo’s `AP21i_is_contained_in`, and only the context is dated: it **witnessed** a period (`crm:P8i_witnessed`). And if the grave lies in a kurgan, it’s part of the kurgan and of the site.

It’s a small shift, but it keeps the data honest. If someone redates the grave tomorrow, every object in it moves along—and nobody has to pretend we dated the objects themselves.

**[Your story: a case where the dating of an object vs. its context caused trouble in your own work?]**

### 2. "Not detected" is not zero

This one hurts every archaeometallurgist who has ever worked with legacy tables. You open an old analysis table and find an empty cell. Or a dash. Or "n.d.". Or a 0. What do they mean? Was the element looked for and not found? Was it never measured? Was it below a detection limit nobody wrote down?

These are **different statements**, and LOD-AM keeps them apart:

- a value below a stated limit ("< 0.001 %") is recorded as a maximum,
- an element that was **not analysed** gets no measurement at all,
- an element that was looked for but **not detected** gets a measurement without a value, marked as `:not_detected`:

```turtle
:Bi_measurement a afr:AFR_0002099, crm:E54_Dimension ;   # mass fraction
    afx:AFX_0002816 chebi:33301 ;                       # quantifies bismuth atom
    crm:P2_has_type :not_detected ;
    qudt:unit unit:PERCENT .
```

And never, ever a 0. Which brings me to the most important rule of all: **values are published as reported.** Nothing is recalculated, normalised or rounded.

While I was at it, my AFO prototype got a proper overhaul too. The analysis now takes a **sample**, and a sampling event connects the sample to the object. Element contents are **mass fractions** (not concentrations), with real numbers and units instead of strings. And lead isotope ratios name both their isotopes.

### 3. Pleiades, but not "the same as"

In linked data, it’s tempting to say "our Arslantepe is the same as Pleiades’ Arslantepe" with `owl:sameAs`. Simple, done. But `sameAs` is a strong claim: it means everything Pleiades says about the place is now also true of *our* site, and everything we say is true of theirs. Merge two datasets with slightly different ideas of a site, and you get a mess.

So when a site is linked to Pleiades, the Pleiades URI becomes an **identifier** of our site—a pointer, not a merger. Next to it, the site keeps the **name as reported** in the publication, because that name is the link back to the literature, and a real GeoSPARQL geometry, so a triple store can actually do spatial queries with it.

### Everything else

There’s more: one IRI per record under `https://lod-am.net/id/`, labels in English and German, our own typology for object types (that one gets the next post), and a bibliography that comes straight from my public Zotero group. Curious for the itty-bitty details?

<img src="https://opengraph.githubassets.com/1/LOD-AM/knowledge-graph/blob/main/CONVENTIONS.md" alt="LOD-AM/knowledge-graph CONVENTIONS.md" width="800" />

[Read CONVENTIONS.md on GitHub →](https://github.com/LOD-AM/knowledge-graph/blob/main/CONVENTIONS.md)

### Why all this effort?

Because the next step was real data. With the conventions in place and every rule checked automatically, a dataset is no longer something I craft by hand—it’s something that has to **pass**. In the last post of this series, I’ll show you the first one that did.

As always, if you have thoughts, suggestions, or just want to geek out about data modelling, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
