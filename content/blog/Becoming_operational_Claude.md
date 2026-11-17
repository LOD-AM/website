---
title: Becoming Operational - Why I Switched from Mistral to Claude
description: I now build LOD-AM with Claude instead of Mistral. Here is why, and how the work is split between us.
date: 2026-11-17
tags: ["concept", "infrastructure"]
draft: true
---

Before I tell you what happened over the last months, there is one thing I want to get out of the way, because I promised to be transparent about how this project is built: **I changed my AI assistant.** In [How I started](/blog/How_I_started/) I wrote that this website was a vibe coding attempt with Mistral. That was true then. Since then, LOD-AM has been built with **Claude**, Anthropic's AI assistant, working directly in the project's GitHub repositories.

### Why the change?

The honest answer is: **time.** LOD-AM is something I do in my free time, next to everything else. Every evening I spend on it has to count. So I have to be as effective as possible, and I simply got more done with Claude.

What made the difference for me is not that Claude can write code. It is that it can carry a task from start to finish: read the conventions, change the data model, run the checks, look at the result in a browser, and come back with a pull request that I can review. When something fails, it tells me what failed instead of pretending it worked. For a one-person project, that is exactly the kind of help I need.

### Who decides what?

This is the part that matters most to me, so let me be clear about it:

- **The research decisions are mine.** What a value means, which type an object belongs to, which period a context dates to, how a concept should be modelled: whenever something is a domain judgement and not a fact from a specification, Claude does not decide it. It writes the question down, and I answer it.
- **Claude does the heavy lifting.** Writing and testing the conversion, looking up ontology terms, checking every AAT identifier against the Getty endpoint, building the website pages, and keeping the documentation up to date.
- **Nothing goes live without me.** Claude works on branches and opens pull requests. I review them and I merge them.

There is one mistake an AI assistant makes all too easily in a project like this: inventing an ontology term that looks plausible but doesn't exist. That's why every term in LOD-AM is checked automatically against the published ontologies (CIDOC CRM, CRMsci, CRMarchaeo, Allotrope, FaBiO) before anything is merged. I don't have to trust the assistant, I can check it.

### And these posts?

Full transparency here as well: Claude drafted this series from our notes, issues and pull requests. I went through it, changed what didn't sound like me, and I stand behind every word.

The next posts in this series, *Becoming Operational*, show what came out of this way of working: new modelling conventions, our own controlled vocabularies, and, finally, the first real dataset online.

As always, if you have thoughts, suggestions, or just want to talk about working with AI in research, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
