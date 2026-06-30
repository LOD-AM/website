---
title: The Infrastructure - A Homelab for LOD-AM
description: How I built LOD-AM on a budget with old hardware and free software.
date: 2026-06-28
tags: ["concept", "infrastructure"]
---

So, how does LOD-AM actually run? The answer might surprise you: **under my desk**. That’s right—this entire project lives on two old Fujitsu mini PCs that I picked up second-hand for next to nothing. Welcome to my homelab.

### Keeping Costs (and Energy) Low

I’m a firm believer in doing more with less. The two mini PCs powering LOD-AM cost me almost nothing upfront, and their energy consumption is minimal. My entire homelab—LOD-AM included, plus a handful of other private services—uses about **0.6 to 0.75 kWh per day**. That’s less than a single load of laundry. The only other expense? A Strato subscription for the domain and related services. That’s it. No cloud bills, no surprise fees. Just a couple of humble machines doing their job quietly, 24/7.

### Free Software All the Way

I’m a strong supporter of the Free Software Movement, so it should come as no surprise that **FOSS is at the heart of everything I do**. My notebook runs **Garuda Linux**—a distro I can wholeheartedly recommend. I code in **VS Codium**, the open-source counterpart to VS Code. Even the AI assistant helping me build this? **Mistral**, open-source and running wherever I need it. And for virtualization, I rely on **Proxmox**, the rock-solid foundation of my homelab. One compromise I made from those principles, is the usage of **GitHub**. I have to admit, that was a decision out of convenience. I am used to **GitHub** and the integration with **Mistral** is so easy to use and I wanted to give you, the reader, the ability to leave comments and reactions here as well. I am using **Giscus** to do that and this little app is depended on **GitHub-Discussions**. But as always I am happy to learn. Maybe there are going to be better, more **FOSS** alternatives to switch to.

### The Backbone: Two LXC Containers

Within Proxmox, two LXC containers form the backbone of LOD-AM. One hosts the **website**, built with Eleventy. The other is home to the **triple store**. Simple, lightweight, and efficient—exactly what I need.

### Choosing a Triple Store: The Evaluation

Early on, I had to decide which triple store to use. I evaluated a few options:

- **GraphDB**: Polished, user-friendly, and powerful. But the free version comes with hard limitations—on the number of repositories, the size of your data, and more. For a project like this, where I want to experiment without hitting artificial walls, that was a dealbreaker.
- **Apache Jena Fuseki**: Fully open-source, no restrictions, and battle-tested. Yes, it’s a bit rougher around the edges. The interface isn’t as sleek, and you’ll need to roll up your sleeves for some configurations. But it’s **real FOSS**—no strings attached.
- **Blazegraph**: Another solid open-source option, known for performance. But its future was uncertain, and I wanted something with stable, long-term support.

### Why Fuseki Won

In the end, the choice was clear: **Apache Jena Fuseki**. I’d rather use a less polished but truly free and open solution than a more polished one that locks me into limitations. For LOD-AM, flexibility and freedom matter more than a pretty interface. Fuseki gives me both.

### The Big Picture

So here’s the setup: old hardware, free software, and a DIY spirit. It’s not the most powerful infrastructure out there, but it’s **mine**. It’s cost-effective, energy-efficient, and—most importantly—it lets me focus on what matters: the data, the connections, and the research.

And if you’re reading this, you’re seeing the result. A project built on the belief that you don’t need expensive tools or corporate solutions to do meaningful work. Sometimes, all you need is a couple of old PCs, a commitment to free software, and the willingness to figure things out as you go.

As always, if you have questions, suggestions, or just want to geek out about homelabs and triple stores, drop me a line at **info@lod-am.net** or (if you have a GitHub-Account) in a **comment** below.