---
title: Goals Reached - From My Research Database to Linked Data
description: My research database stays private, the released publications go out as Linked Data. How the pipeline in between works.
date: 2026-11-23
topics: ["research_data_management", "legacy_data", "rdf"]
draft: true
---

Here’s a question I avoided for a long time: where does the data for LOD-AM actually *come from*? The honest answer is: from my **research database**. A relational database where I collect finds, contexts and analyses from the literature, one publication at a time. It’s my working tool, and it’s full of things that are not ready for the world: half-entered tables, open questions, notes to myself.

So I had a problem. I want the data out there as Linked Open Data. But not *all* of it, and not before I’ve checked it. The answer to that is the **pipeline**.

### One rule: the database stays private

This was the first decision, and the easiest one. The database as a whole stays private. What goes online is a **released publication**: the finds and analyses of one article, and only what they point to (their sites, contexts, periods, types, laboratories). A publication is released when I say so, and not a minute earlier.

The same goes for the code: the pipeline lives on GitHub, but it runs on a container in my homelab, right next to the database. The data never goes to GitHub.

### From tables to triples

In the [Becoming Operational](/blog/Becoming_operational_Claude/) series, Arslantepe was converted by a script. That worked, but it meant that the rules of the data model lived twice: once in the [conventions](/blog/Becoming_operational_Conventions/), once in the code. Now the way from the database to RDF is a **mapping**: R2RML, run with Ontop. The mapping says, table by table, which column becomes which triple. No hidden logic, no clever tricks in between.

The pipeline then goes through the same steps every time:

1. take a **snapshot** of the database, so nothing changes while it runs,
2. **map** it to RDF,
3. **enrich** it,
4. **check** it: every term against the published ontologies, every record against the SHACL shapes of the knowledge graph,
5. cut out the **released publications**, one file each.
<!-- REVIEW (owner): say in a sentence what "enrich" does for you; I left it generic on purpose. -->

If a check fails, nothing is released. That’s the whole point.

### A release you can check

Every release comes with a **manifest**: which version of the pipeline and of the knowledge graph produced it, and a checksum for every file. That sounds boring, but it means that the triplestore and the website can check that they got exactly what the pipeline produced, nothing more and nothing less. And the manifest contains no numbers about the full database, because that stays private, too.

### Why all this effort?

Because I’m lazy, in the good way. Arslantepe took many evenings. The next publication should take the evenings I need to *check the data*, not the evenings to build the machinery again. Now the machinery is there.

In the next part, I’ll show you where a release goes once it leaves the pipeline: the triplestore.

As always, if you have thoughts, suggestions, or your own story about getting data out of a research database, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
