---
title: How I started
description: So, how we got to the point to see this website? I'll tell you.
date: 2026-06-23
tags: ["blog", "concept"]
---

Hi again, it’s me—Fabian. In the About-Post, I introduced LOD-AM as my personal sandbox for experimenting with Linked Open Data in archaeometallurgy. Today, I want to share how this sandbox actually became a website you can visit. The short answer: **Eleventy, Bootstrap 5, and JavaScript**—with a little help from an AI assistant.

### Why Eleventy?

I needed a tool that would let me focus on content and data, not on fighting with complex build systems. **Eleventy** fit the bill perfectly. It’s a static site generator that’s fast, flexible, and—most importantly—unopinionated. No forced folder structures, no convoluted configuration. Just files in, HTML out. And since it’s JavaScript-based, I can use the same language to both build my site and interact with my triple store. That simplicity is exactly what I needed for a project where the data, not the framework, should be the star.

### Bootstrap 5: Pragmatism Over Perfection

Here’s a confession: I’m not a web designer. I never claimed to be, and I have no intention of becoming one. My interest lies in the data, in the connections between entities, in making sense of archaeometallurgical information. So when it came to making this site look presentable, I turned to **Bootstrap 5**.

It’s a pragmatic choice. Bootstrap gives me responsive design, accessibility, and a clean look without requiring me to dive into the depths of CSS. Yes, it’s perhaps the easy way out. But my goal here isn’t to win design awards—it’s to create a functional, user-friendly space where I can share my work and display the entities from my triple store. And Bootstrap lets me do that efficiently.

### Connecting the Dots: JavaScript and the Triple Store

The core of LOD-AM is the **triple store**, my RDF-based database where I’m collecting and connecting data on ancient metallurgy. But a database is only as useful as your ability to interact with it. That’s where JavaScript comes in.

With Eleventy’s JavaScript-friendly nature, I can query my triple store using SPARQL and fetch the data directly into my site. Whether at build time or client-side, I can pull in entities, display their relationships, and keep the content dynamic without sacrificing the simplicity of a static site. It’s not always seamless—there are plenty of moments debugging queries or troubleshooting data models—but it’s effective. And that’s what matters.

### A Modern Workflow: Mistral and GitHub

Now, here’s something I won’t hide: **this website is pretty much a vibe coding attempt**. I’m using Mistral to help me write, debug, and refine the code. Am I a developer? Not really. But I don’t need to be. Mistral helps me bridge the gaps in my knowledge, allowing me to focus on what I *do* know—my data and my research.

Connecting Mistral with the GitHub repository has been a game-changer. It’s the most effective approach I’ve found to build this site without getting bogged down in the technical weeds. I can iterate quickly, test ideas, and fix issues without spending hours on Stack Overflow. The result? A workflow that lets me spend my time where it matters: working on the data, exploring the connections, and turning LOD-AM into something useful.

### The Bigger Picture

So here we are: a website built with Eleventy, styled with Bootstrap, powered by JavaScript, and assisted by AI. It’s not the most sophisticated setup, nor is it the most polished. But it’s **effective**. It lets me share my work, display my data, and document my journey without the overhead of becoming a full-stack developer.

This project is still very much a work in progress. But with these tools and this approach, I’m able to focus on what really matters: the data, the connections, and the insights. And if you have thoughts, suggestions, or just want to share your own experiences, I’d love to hear from you at **info@lod-am.net**.