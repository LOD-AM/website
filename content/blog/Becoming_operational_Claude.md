---
title: Becoming Operational - Why I Switched from Mistral to Claude
description: I now build LOD-AM with Claude instead of Mistral. Here is why, and how the work is split between us.
date: 2026-11-17
tags: ["concept", "infrastructure"]
draft: false
---

Hi again! It’s been quiet on the blog for a while—but not in the repositories. A lot happened, and over the next few posts I’ll tell you how LOD-AM went from a hand-written example to its first real dataset online. But before I get to that, there’s something I want to get out of the way. I promised to be transparent about how this project is built, so here it is: **I changed my AI assistant.**

### From Mistral to Claude

In [How I started](/blog/How_I_started/), I wrote that this website was pretty much a vibe coding attempt with Mistral. That was true back then. Since then, LOD-AM has been built with **Claude**, Anthropic’s AI assistant, working directly in my GitHub repositories.

I am glad enough to work with a lot of colleagues, who love to experiment with every piece of technology available. And when I got a recommendation and a report of his recent progress from my dear colleague Lasse, I just had to try it out. We'll see how the European competitors of Anthropic will do. I am hoping for the best. Competition boosts business afterall. 

### Why? Time.

Here’s the thing: LOD-AM is a free-time project. It has to fit into spare evenings between everything else. Every hour I spend on it has to count—so I have to be as **effective** as possible. And with Claude, I simply get more done.

What made the difference for me isn’t that Claude can write code. It’s that it can carry a task from start to finish: read my conventions, change the data model, run the checks, look at the result in a browser, and come back with a pull request I can review. And when something fails, it tells me what failed—instead of pretending it worked.

### Who decides what?

This part matters most to me, so let me be clear about it:

**The research decisions are mine.** What a value in a publication means, which type an object belongs to, which period a context dates to—whenever something is a domain judgement and not a fact from a specification, Claude doesn’t decide it. It writes the question down, and I answer it. My sandbox, still my rules.

**Claude does the heavy lifting.** Writing and testing the conversion, looking up ontology terms, checking every AAT identifier against the Getty endpoint, building the pages you see here, keeping the documentation up to date.

**Nothing goes live without me.** Claude works on branches and opens pull requests. I review them, and I merge them.

### Trust, but check

There’s one mistake an AI assistant makes all too easily in a project like this: inventing an ontology term that *looks* perfectly plausible but doesn’t exist. That’s why every single term in LOD-AM is now checked automatically against the published ontologies before anything is merged. I don’t have to trust the assistant—I can check it.

### And these posts?

Full transparency here as well: Claude drafted this series from our notes, issues and pull requests. I went through it, changed what didn’t sound like me, and I stand behind every word.

Curious how the rules for Claude look? They’re in the repositories, right next to the code:

<img src="https://opengraph.githubassets.com/1/LOD-AM/knowledge-graph" alt="LOD-AM/knowledge-graph" width="800" />

[View LOD-AM/knowledge-graph on GitHub →](https://github.com/LOD-AM/knowledge-graph)

As always, if you have thoughts, suggestions, or just want to talk about working with AI in research, you know where to find me: **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.
