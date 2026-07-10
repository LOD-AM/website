---
title: Tackling Legacy Data practically
description: How I'm using a 2002 paper on Arslantepe's metal objects to build practical Linked Open Data solutions for archaeometallurgical challenges.
date: 2026-07-09
tags: ["case study", "modelling", "Arslantepe"]
---

So, I’ve got my ontologies sorted and my vocabularies in place. But none of that matters much if I don’t have **real data** to work with. That’s where this 2002 paper comes in.

Curious for the paper itself?

{% academicLink "https://doi.org/10.3406/paleo.2002.4745" %}

## Why This Paper?

Here’s the thing: I needed a **real-world example** that exposes the messy, complicated data issues we face in archaeometallurgy. And this paper by **Hauptmann, Schmitt-Strecker, Begemann, and Palmieri** is *perfect*.

Arslantepe—a 30-meter-high tell in Eastern Anatolia—has a **"Royal Tomb"** complex from the Early Bronze Age, packed with objects made from alloys that have been analyzed for both **trace elements** and **lead isotopes**. It’s a goldmine of data, but it’s also a **minefield** of modelling challenges.


## The Six Challenges It Throws At Us

Working through this paper, I quickly realized it forces me to confront **six critical modelling questions** that keep coming up in legacy archaeometallurgical literature:

### **1. The Unknowns: Fragments Without Types**
So, there are metal fragments in the assemblage that can’t be assigned a definitive typology. They’re just... fragments. No clear morphology, no easy classification. This is a **fundamental issue** in archaeology: how do you represent objects when you don’t have enough information to classify them? It’s not just about missing data—it’s about **structural uncertainty** in your knowledge model. If we can’t handle unknowns gracefully, we can’t model real-world archaeology.

### **2. The Double Analysis: Trace Elements + Lead Isotopes**
The paper presents **both** trace element compositions and **lead isotope ratios** for the same artifacts. This isn’t just about storing two datasets—it’s about **linking analytical methods** that tell different stories. Trace elements speak to alloy composition and technological choices; lead isotopes reveal provenance and trade networks. The challenge? Modelling these as **complementary but distinct** lines of evidence that together tell a richer story about the object’s history.

### **3. The Chronology Puzzle: Multiple Complexes, Different Dates**
Arslantepe’s **Royal Tomb** and **Palace hoard** belong to different archaeological complexes with distinct chronological attributions. This is where **stratigraphic reality** meets data modelling: sites don’t have single dates, they have **complex temporal layers**. The question is how to represent objects that belong to different phases, with different dating methods, and sometimes overlapping timeframes—without flattening the archaeological record into oversimplified categories.

### **4. The Fuzzy Data: ">0.1%", "<0.5%", "Not Detected"**
The paper includes **qualitative descriptors** like "`>0.1%`", "`>0.5%`", or "**not detected**" rather than precise values. This is **real analytical data**—not sloppy work, but the nature of detection limits and measurement uncertainty. The modelling challenge is preserving this **nuance** while still making the data queryable. If we force everything into exact numbers, we lose the honesty of the original analysis. If we treat it as text, we lose the ability to reason computationally.

### **5. The Spearhead Problem: One Artifact, Two Samples**
Two samples were taken from **different parts of the same spearhead**—one from the **blade**, one from the **socket**—yielding different results. This exposes a **fundamental tension** in archaeometallurgical data: the **artifact** (the conceptual whole) vs. the **sample** (the physical fragment analyzed). How do we maintain the relationship between them? How do we track that sample A and sample B come from the same object, but represent different materials or manufacturing processes? Get this wrong, and you lose the very connections that make the data meaningful.

### **6. The ID Chaos: Excavation, Lab, and Publication Systems**
The artifacts carry **three different identifier schemes** from different contexts. This is the **reality of legacy data integration**: every institution, every project, every publication creates its own system. The challenge isn’t just technical—it’s **conceptual**. How do we reconcile that "Tomb 16/H/50" in the excavation log, "AR-23" in the lab notebook, and "Fig. 3, no. 12" in the paper all refer to the same physical object? Without solving this, we can’t link datasets, and without linking datasets, we can’t do meaningful cross-project research.


## The Roadmap: From Paper to Queryable Data

So here’s my plan: over the next series of posts, I’ll tackle each challenge systematically.

**Next Post:** *Modelling Unknowns: Fragments, Fuzzy Values, and Probabilistic Typing*
- Deep dive into **CIDOC-CRM + Getty AAT** for uncertain classifications
- Introduction of the **fuzzy value extension**

**Following Post:** *The Analytical Workflow: Linking Trace Elements and Lead Isotopes with AFO*
- Step-by-step mapping of **measurements (fuzzy or not)** based on **AFO**

**Later Post:** *Temporal Modelling: Arslantepe’s Stratigraphy in PeriodO*
- How I **extended PeriodO** with local phases
- Experimenting with a hierarchy for **chronological phases**

**Final Post:** *The Full Arslantepe Dataset: Querying the Triple Store*
- **Live SPARQL endpoint** demonstration
- **Example queries** addressing all six challenges

As always, if you have thoughts, suggestions, or just want to nerd out about archaeometallurgical data modelling, write me an Email to **info@lod-am.net** or (if you have a GitHub account) in a **comment** below.