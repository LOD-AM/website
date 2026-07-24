---
title: Learning by Doing
description: How my ontological ideas turned into actual data—and what I learned along the way.
date: 2026-07-23
tags: ["concept", "data"]
---

It’s been a while since my last post. That’s just how these learning-by-doing projects go, especially when you’re fitting them into spare moments between everything else. But I haven’t been idle. Far from it. I’ve been working on turning my ontological ideas into actual data—and I’m ready to share the first example.

You can find the itty-bitty details here: [https://github.com/LOD-AM/ontologies/blob/main/examples/lod-am-example.ttl](https://github.com/LOD-AM/ontologies/blob/main/examples/lod-am-example.ttl)

<img src="https://opengraph.githubassets.com/1/LOD-AM/ontologies/blob/main/examples/lod-am-example.ttl" alt="LOD-AM/ontologies" width="800" />

[View LOD-AM/ontologies on GitHub →](https://github.com/LOD-AM/ontologies)

### Sticking Closer to CIDOC-CRM Than Expected

If you’ve been following along, you know I’m not the biggest fan of event-based modeling. But here’s the thing about good research: sometimes you have to follow the logic, even when it takes you somewhere you didn’t expect. In this case, that somewhere was **closer to vanilla CIDOC-CRM** than I originally planned.

Now, I didn’t go all-in on events. I still avoided modeling excavation events, collection histories, or legal provenance. Not because those aren’t important—they absolutely are—but because they’re **not my focus**. There are better specialists and better projects out there for those questions. My sandbox, my rules.

### Where I Kept the Events

There are a few places where I *did* embrace the event-based approach, and for good reason.

**Typological Assignments:**
At first glance, it’s tempting to just say:
```turtle
:object1 crm:P2_has_type :spearhead .
```
Simple, straightforward, queryable. But here’s the catch: typology isn’t always black and white. Different regions use different terminologies. Even within the same system, the same artifact might be a knife to one researcher and a dagger to another—and both could be right.

I learned this the hard way during my very first Hiwi job at university. I was entering thousands of paper records into a database for an Iron Age site in southern Germany. At some point, we realized we’d duplicated some iron finds. As I worked through the deduplication, I noticed something interesting: the same artifact might be recorded as a *knife* in one document and as *half of a pair of scissors* in another. There’s only one physical truth, but typologically, both classifications can be valid.

So, I decided to stick with CIDOC’s approach. Every typological assignment now lives in its own **crm:E17_Type_Assignment** entity, with its own context. Same goes for **crm:E4_Period** assignments—I’m keeping each dating in its own **crm:E52_Time-Span** node.

### The AFO Prototype

I’ve also got a prototype running for the Allotrope Framework. Every analyzed object is defined as **afm:AFM_0001099** (an object of mixed chemical composition in AFO-speak). That’s where the ontologies overlap.

For the analysis itself, AFO offers some handy classes. Spectrometry, for example, uses **afp:AFP_0000527**. And for results, AFO has properties for absolute and relative values. An absolute value might look like this:
```turtle
:Ag_measurement a afr:AFR_0002036 ;
    afx:AFX_0002816 chebi:23855 ;  # Silver
    afo:value "0.002"^^xsd:decimal ;
    afo:unit "PERCENT" .
```
And a relative value (like a maximum or minimum) would use a different property:
```turtle
:Pb_measurement a afr:AFR_0002036 ;
    afx:AFX_0002816 chebi:28702 ;  # Lead
    afx:AFX_0000331 "0.001"^^xsd:decimal ;  # <0.001%
    afo:unit "PERCENT" .
```
Here, **chebi** (Chemical Entities of Biological Interest) acts as a controlled vocabulary for the elements.

I was lucky enough to get into contact with some **AFO** specialists from **NFDI4Chem**. We will see, how my first prototype will hold up to their judgment. In any case, I am sure, that I am going to **learn** a lot from that. 

### FABIO

As for literature, I didn’t reinvent the wheel. FABIO is a well-established standard, and I implemented it pretty much as-is. The connection point to CIDOC is usually **crm:P71_is_listed_in**—which might end up being one of the most frequent properties in the whole triple store.

### What’s Next?

So, what’s on the horizon? A few things, not necessarily in this order:

First, I just got an account with **Pleiades**. They’ve been incredibly responsive—Tom Elliott even spread the word about my little project. Tom, if you’re reading this: **Thank you!** I’m looking forward to sharing my experiences with Pleiades soon.

I’m also planning to produce **PeriodO-aligned data**. Full transparency: I initially missed that PeriodO *does* support hierarchical relationships between periods. Turns out I just picked unlucky test cases at first. Now that I see it, I’m excited to dive in.

And, because I’m all about efficiency, I’m working on some **automation**—generating my own data from CSV files and pulling terms from Getty AAT into my triple store.

So, that’s where things stand. Still learning, still building, still figuring it out as I go. And as always, if you have thoughts, suggestions, or just want to geek out about data modeling, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.