---
title: "HP Print Analytics Dashboard"
subtitle: "From spreadsheets to real-time fleet intelligence"
description: "Data visualization dashboard for HP's enterprise print fleet management. Real-time monitoring, cost optimization, and predictive maintenance insights."
cover: "/assets/projects/hp-cover.jpg"
heroImage: "/assets/projects/hp-hero-thumb.jpg"

client: "HP Inc."
role: "UX/UI Designer"
company: "Deloitte Digital"
team: "1 designer, 1 data scientist, 3 engineers"
timeline: "6 months, 2022–2023"
year: 2023
tools: ["Figma", "D3.js concepts", "Miro"]
platform: "Web (desktop-first)"
deliverables: ["Dashboard UI", "Data visualization system", "Alert framework", "Onboarding flow"]

tags: ["Dashboard", "Data Viz", "Enterprise"]
order: 3
draft: false

problem:
  heading: "The Problem"
  body: "Fleet managers monitored thousands of printers across multiple locations using 4 separate tools and manual spreadsheets. No real-time visibility meant problems were discovered hours or days after they occurred. Unplanned downtime cost enterprise clients an average of $12K per incident."

users:
  heading: "Users"
  body: "Enterprise fleet managers (40-55) responsible for 500-5,000 devices across 10-50 locations. Technical but not developers. They needed to answer one question fast: **'Is anything broken or about to break?'**"

research:
  heading: "Discovery"
  body: |
    - **8 contextual inquiries** at client sites watching fleet managers work
    - Mapped their daily workflow — 60% of time was spent *finding* information, not *acting* on it
    - **Card sorting** with 15 users to define the information hierarchy
    - Key insight: managers didn't need more data — they needed **fewer, smarter alerts**

strategy:
  heading: "Approach"
  body: |
    Designed around the concept of **"anomaly-first"** — the dashboard's default state shows nothing noteworthy. Only deviations surface. This inverted the traditional dashboard model where everything is always visible.

    Three-tier information architecture:
    1. **Glance** — status bar, is anything wrong? (2 seconds)
    2. **Scan** — which locations/devices need attention? (10 seconds)
    3. **Dive** — full device history, maintenance logs, cost data (2+ minutes)

solution:
  heading: "The Dashboard"
  body: "Single-pane view replacing 4 tools. Real-time status map with location heat overlay. Predictive alerts using ML-based toner/maintenance forecasting. Cost analytics with department-level breakdown. Every data point is interactive — click to drill down, never navigate away."

results:
  heading: "Impact"
  body: "Measured across 12 enterprise accounts over 6 months post-deployment."
  metrics:
    - value: "-60%"
      label: "Unplanned downtime"
    - value: "1"
      label: "Tool replacing 4 separate systems"
    - value: "23 min"
      label: "Average daily time saved per manager"
    - value: "$2.1M"
      label: "Annual savings across pilot accounts"

testimonial:
  quote: "We went from firefighting to forecasting. I can see a problem coming three days before it happens now."
  author: "Sarah Chen"
  role: "Fleet Operations Manager, Fortune 500 client"

reflection:
  heading: "Learnings"
  body: "The hardest part was designing for data density without overwhelming users. Early iterations showed too much — users felt anxious seeing 5,000 devices at once. The 'anomaly-first' approach emerged from testing, not planning. Also learned that enterprise dashboard onboarding is its own product — we built a 5-step guided setup that became one of the most-praised features."

gallery:
  - src: "/assets/projects/hp-01.jpg"
    alt: "Fleet overview with anomaly highlighting"
    caption: "Anomaly-first: only deviations surface by default"
  - src: "/assets/projects/hp-02.jpg"
    alt: "Predictive maintenance timeline"
    caption: "ML-powered maintenance forecasting"
  - src: "/assets/projects/hp-03.jpg"
    alt: "Cost analytics breakdown"
    caption: "Department-level cost visibility"
---
