import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Reusable schema for a content section with optional image
const sectionBlock = z.object({
  heading: z.string().optional(),
  body: z.string(),              // Markdown supported
  image: z.string().optional(),  // path to image
  imageAlt: z.string().optional(),
}).strict();

// A single metric/result callout
const metricBlock = z.object({
  value: z.string(),             // e.g. "+34%", "2x", "$1.2M"
  label: z.string(),             // e.g. "Task completion rate"
}).strict();

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    // ── Hero ──
    title: z.string(),
    subtitle: z.string().optional(),          // outcome-oriented tagline
    description: z.string(),                  // 2-3 sentence executive summary
    cover: z.string(),                        // hero image (project detail page)
    coverVideo: z.string().optional(),        // hero video (mp4/webm) — replaces image when present
    heroImage: z.string().optional(),         // thumbnail for flying card in hero section

    // ── Metadata bar ──
    client: z.string().optional(),
    role: z.string().optional(),
    company: z.string().optional(),           // company you worked at/with (e.g. "Accenture", "Freelance")
    companyLogo: z.string().optional(),       // path to company logo
    team: z.string().optional(),              // e.g. "2 designers, 3 engineers, 1 PM"
    timeline: z.string().optional(),          // e.g. "10 months, 2023–2024"
    year: z.number(),
    tools: z.array(z.string()).default([]),   // Figma, Miro, etc.
    platform: z.string().optional(),          // iOS, Android, Web, etc.
    deliverables: z.array(z.string()).default([]), // wireframes, prototypes, design system...

    // ── Classification ──
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    protected: z.boolean().default(false),    // NDA — password-gated

    // ── External links ──
    link: z.string().url().optional(),        // live project
    behance: z.string().url().optional(),
    figma: z.string().url().optional(),

    // ── Structured case study sections (frontmatter, rendered by template) ──
    problem: sectionBlock.optional(),
    users: sectionBlock.optional(),           // target audience / personas
    research: sectionBlock.optional(),        // discovery & insights
    strategy: sectionBlock.optional(),        // approach & design principles
    solution: sectionBlock.optional(),        // final design / redesign
    results: z.object({
      heading: z.string().optional(),
      body: z.string().optional(),
      metrics: z.array(metricBlock).default([]),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
    }).optional(),
    testimonial: z.object({
      quote: z.string(),
      author: z.string(),
      role: z.string().optional(),
    }).optional(),
    reflection: sectionBlock.optional(),      // learnings, what I'd do differently

    // ── Gallery (additional images below case study) ──
    gallery: z.array(z.object({
      src: z.string(),
      alt: z.string().optional(),
      caption: z.string().optional(),
    })).default([]),
  }),
});

export const collections = { projects };
