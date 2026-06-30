---
title: The Ontologies - Choosing the Right Tools for the Job
description: How I chose CIDOC CRM, FRBRoo, and the Allotrope Framework for LOD-AM.
date: 2026-06-29
tags: ["concept", "ontology"]
---
So, I’ve got my homelab running, my website set up with Eleventy, and my triple store humming away with Fuseki. But none of that matters much if I don’t have a solid way to structure the data. That’s where the ontologies come in.

### Why Ontologies Matter

I needed a way to represent archaeological objects, scientific analytics, and literature in a way that’s both meaningful and interoperable. Since I’m not reinventing the wheel here, I looked for established standards that fit my needs—and my FOSS philosophy.

### CIDOC CRM: The Foundation

For the archaeological core, **CIDOC CRM** was the obvious choice. It’s the international standard for cultural heritage data, widely adopted, and designed for exactly what I’m doing. Yes, it’s event-based, which can get complex. But here’s the thing: I don’t need to model every single event in the history of an artifact. I’m focusing on what matters—**the objects themselves, their materials, their locations, and the scientific analyses performed on them**. For everything else? I’ll add it later if I need it.

CIDOC CRM gives me interoperability with museums, archives, and other cultural heritage systems. And since it’s an ISO standard, I know it’s not going anywhere.

### FRBRoo: For the Literature

Archaeology relies heavily on literature—often old, often without DOIs. I needed a way to reference papers, reports, and books in a structured way. Enter **FRBRoo**, an extension of CIDOC CRM specifically for bibliographic data.

FRBRoo lets me model works, expressions, manifestations, and items in a way that’s compatible with both libraries and museums. And crucially, it handles **legacy literature without DOIs** just fine. I can use local identifiers, author names, titles, dates—whatever I have. It’s not perfect, but it’s flexible enough for my needs.

### Allotrope Framework: For the Science

The tricky part was the scientific analytics. I needed an ontology that could handle chemical compositions, dating methods, and material analyses. After some research, I landed on the **Allotrope Framework Ontology (AFO)**.

AFO is designed for analytical chemistry and materials science. It lets me represent measurements, units, techniques, and results in a structured way. It’s not specifically built for archaeology, but that’s okay—it’s **RDF-based, open-source, and it works**. And since I’m using it alongside CIDOC CRM, I can link my archaeological objects directly to their scientific analyses.

But to be very sure (and to use my day-time job connections as good as possible), I am trying to get in touch with specialists from **NFDI4Chem** to evaluate this idea.

### The Pragmatic Approach

Now, I’ll be honest: I’m not creating formal mappings between these ontologies (yet). For now, I’m using **direct links**—objects carry analysis results, literature refers to objects, and so on. It’s simple, it works, and it lets me focus on building the actual data.

Is this the most elegant solution? Probably not. But it’s **pragmatic**. As a one-person project, I need to move fast and stay flexible. If LOD-AM grows, I can always refine the model later.

### Putting It All Together

So here’s the stack:
- **CIDOC CRM** for the archaeological objects and their context
- **FRBRoo** for the literature
- **Allotrope Framework** for the scientific analytics

Together, they give me a solid foundation that’s interoperable with the wider cultural heritage and scientific communities. And since all three are FOSS-friendly, they fit perfectly with the rest of my setup.

As always, if you have thoughts, suggestions, or just want to nerd out about ontologies, you know where to find me: **info@lod-am.net** or (if you have a GitHub-Account) in a **comment** below.