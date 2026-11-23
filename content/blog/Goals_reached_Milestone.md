---
title: Goals Reached - Looking Back at Where I Started
description: LOD-AM has reached the goals I set at the very beginning. Time to look back at the list, goal by goal.
date: 2026-11-23
topics: ["research_data_management", "linked_data", "open_data"]
draft: true
---

Hi again! Today is a good day for LOD-AM. When I started this sandbox back in June, I wrote down a list of goals on the [About page](/about/). I didn’t really expect to tick them off this year, if ever. Well: **we got there.** Apart from a few last points in the automation workflow, every goal on that list is reached.

That deserves more than a single post. So here is a new series. In this first part I go through my old list, goal by goal. In the next parts I show you what happened behind the scenes in the last few days: the [pipeline](/blog/Goals_reached_Pipeline/) that turns my research database into Linked Data, the [triplestore](/blog/Goals_reached_Triplestore/) that is now open to everyone, and the [website](/blog/Goals_reached_Website/), where you can now query, search and cite the data yourself.

### The list, goal by goal

**Experiment with Linked Open Data for Ancient Metallurgy in a low-pressure sandbox.** Check. And I mean *experiment*: my first prototype used a property that doesn’t even exist in CIDOC CRM 7.1.3 (I [confessed that already](/blog/Becoming_operational_Conventions/)). Failing was allowed, and I used that permission a lot.

**Practice Learning by Doing.** Check, with honours. I learned more about R2RML, SHACL, named graphs, webhooks and nginx in the last months than in years of reading about them. Some of it the hard way.

**Build an RDF-based triple store to collect and combine archaeometallurgical data from diverse sources.** Check. The triplestore is running, it holds the knowledge graph and the released data, and since today it is **publicly queryable**. "Diverse sources" is still a bit of a promise: so far, one publication is released, with the literature its chronologies come from. But the way from my research database to the triplestore now runs automatically, so the next publications are a question of checking, not of building.

**Use blog posts as a public notebook, mistakes included.** Check. This is post number eleven. Mistakes included, see above.

**Display entities from the database directly on the site.** Check. Every find, every analysis, every context, period and site has its own page under `https://lod-am.net/id/`. Start with the [Data overview](/data/) if you haven’t been there yet.

**Keep it private and responsibility-free – for now, at least.** Hmm. Half a check. LOD-AM is still my private one-person project, no institution behind it. But data with persistent IRIs, a public endpoint and a citation recommendation are a kind of responsibility. I’m fine with that. That’s what the sandbox was for.

**Invite feedback and commentary.** Always. My address is at the end of every post.

### What’s left

A few last points in the automation workflow. Most of the chain from database to website runs on its own now, but some steps still need me on the server, and some small things need tidying. And honestly, that’s how it should be: the last step, putting data online, stays my decision. Every release arrives as a pull request, and I merge it.

As always, if you have thoughts, suggestions, or just want to celebrate a little with me, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
