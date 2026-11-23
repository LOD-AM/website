---
title: Goals Reached - The Triplestore Goes Public
description: The LOD-AM triplestore now answers SPARQL queries from everyone, and it updates itself. What changed under my desk.
date: 2026-11-23
topics: ["triplestore", "sparql", "self_hosting"]
draft: true
---

Remember the [two old mini PCs under my desk](/blog/The_infrastructure/)? They’re still there, and they’re still doing their job quietly. But since today, one of them does something new: the LOD-AM triplestore answers **SPARQL queries from everyone**.

```
https://triple.lod-am.net/LOD-AM/sparql
```

No login, no API key. Just send a query. (Or, much easier, use the [query editor](/query/) on this website. More on that in the next part.)

### Still Fuseki

I [chose Apache Jena Fuseki](/blog/The_infrastructure/) back in June because it is real free software, and I haven’t regretted it. It now runs in Docker in a container of its own, Fuseki 6.2.0, and Watchtower keeps the image up to date.

What changed is how the data is organised inside. There are now two **named graphs**:

- the **knowledge graph**: the vocabularies of LOD-AM, our typology, the topics of this blog,
- the **published data**: the released publications from the [pipeline](/blog/Goals_reached_Pipeline/).

A query without any graph sees both together. So you don’t have to care, unless you want to. And when one of them is updated, the other one stays untouched.

### Open, but not too open

Making a database public on a home server needs some care. Reading is open to everyone. Writing is not: the endpoint that changes data needs the admin login, and the firewall only lets requests through that come from my reverse proxy. A query that runs too long is stopped after a while, so one heavy query can’t keep the little machine busy for the rest of the day. And there’s a small text index on the labels, so searching for a name is fast.

And because I care about privacy: Fuseki logs the queries it gets, but the logs are capped, so old entries disappear after a while. The [privacy policy](/privacy/) says what that means for you.
<!-- REVIEW (owner): you approved the privacy wording on website#57; check this paragraph says the same. -->

### It updates itself

This is the part I’m proudest of, because it means I don’t have to log in to the server every time something changes.

- When the pipeline has a **new release**, it tells the triplestore. The triplestore pulls the release, checks every file against the manifest, loads it in one go, rebuilds the text index and runs a smoke test. If anything fails on the way, the old data is put back.
- Every morning, the triplestore looks at the **knowledge graph** on GitHub. If its data changed and all checks passed, it is loaded the same way.
- If anything goes wrong, I get a **mail**. (I tested that, of course, by breaking it on purpose. It works.)

And once a release is live in the triplestore, it is handed on to the website. But that’s for the next part.

Curious for the setup? It’s all in the repository, minus the secrets:

<img src="https://opengraph.githubassets.com/1/LOD-AM/triplestore" alt="LOD-AM/triplestore" width="800" />

[View LOD-AM/triplestore on GitHub →](https://github.com/LOD-AM/triplestore)

As always, if you have questions, suggestions, or you managed to write a query that brings my little server to its knees, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
