---
title: Goals Reached - Query, Search and Cite the Data
description: The LOD-AM website is no longer just a window on the data. You can now query it, search it, download it and cite single records.
date: 2026-11-23
topics: ["linked_data", "sparql", "fair_data"]
draft: true
---

When [Arslantepe went online](/blog/Becoming_operational_Arslantepe/) last week, you could look at the data: one page per record, nicely linked. That was already one of my goals. But looking is only half of it. Linked Open Data is meant to be **used**. So in the last days, the website learned a lot of new things.

### Ask your own questions

The new [query editor](/query/) lets you send SPARQL queries straight to the [public triplestore](/blog/Goals_reached_Triplestore/). You don’t know where to start? There are [example queries](/query/examples/): the lead isotope ratios of a site, all finds of a type, the elements that were looked for but *not detected*, the arsenic contents of a phase, and a few more. Every one of them is tested automatically against the released data, so they won’t quietly break.

And a word on privacy, because it matters to me: the editor sends **nothing** before you press "Run", and it stores nothing. All its files come from this website.

### Search

Not everyone wants to write SPARQL (I get it). So there’s now a [search](/search/) as well. It finds blog posts and records alike, and you can filter by kind of record or by topic. It runs completely in your browser, with an index built together with the site. No search engine in between.

### Cite and download

Every record page now has a **"Cite and download"** section: a citation for that single record, and the record itself as Turtle or JSON-LD. On top of that:

- the **whole released dataset** in [one file](/data/lod-am.ttl),
- a [VoID description](/data/void.ttl) of it, so machines know what’s in there and where to query it,
- a page on the [data model](/data/model/), with a diagram of the records and the vocabularies they use,
- and a **data changelog** on the [Data overview](/data/): every release, with what changed.

And the IRIs themselves are getting smarter: ask `https://lod-am.net/id/…` for Turtle or JSON-LD instead of a web page, and you’ll get the data.

### Seeing the data

The pages got some pictures, too. Every site page shows a relief map of the whole research area with the site on it. And the [analyses of Hauptmann et al. 2002](/data/publications/hauptmann2002chemical/analyses/) now come with histograms of the element contents and lead isotope diagrams, drawn from the values exactly as reported. Oh, and there’s a light mode now, for those of you who read in daylight.

### From release to website, automatically

Here the chain from the last two parts comes full circle. When a release goes live in the triplestore, it is sent to the website as a **pull request**. The website checks that the files are exactly the released ones, builds the pages and runs all its checks. Then it waits for me. I read what changed, write a line for the changelog, and merge. Minutes later, it’s online.

That’s the one step I want to keep by hand. The machines do the work; the decision to publish stays with me.

### What’s next

More data! The machinery is in place, so the next publications are a question of checking the data, not of building tools. And a few last points in the automation workflow, of course. I’ll report back.

Curious for the code behind all this?

<img src="https://opengraph.githubassets.com/1/LOD-AM/website" alt="LOD-AM/website" width="800" />

[View LOD-AM/website on GitHub →](https://github.com/LOD-AM/website)

As always, if you have thoughts, suggestions, or you found something with the query editor I should know about, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
