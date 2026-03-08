import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    series: z.string().optional(),
    seriesOrder: z.number().int().positive().optional(),
    draft: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
    stack: z.array(z.string()).optional().default([]),
    roles: z.array(z.string()).optional().default([]),
    outcomes: z.array(z.string()).optional().default([]),
    redirected: z.boolean().optional().default(false),
    redirectedUrl: z.string().url().optional(),
  }),
});

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
    stack: z.array(z.string()).optional().default([]),
    roles: z.array(z.string()).optional().default([]),
    outcomes: z.array(z.string()).optional().default([]),
    maturity: z.enum(["seed", "growing", "evergreen", "archived"]).optional().default("seed"),
    aliases: z.array(z.string()).optional().default([]),
    relatedNotes: z.array(z.string()).optional().default([]),
    relatedSnippets: z.array(z.string()).optional().default([]),
    changelog: z
      .array(
        z.object({
          date: z.coerce.date(),
          summary: z.string(),
        }),
      )
      .optional()
      .default([]),
  }),
});

const snippets = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
    stack: z.array(z.string()).optional().default([]),
    roles: z.array(z.string()).optional().default([]),
    outcomes: z.array(z.string()).optional().default([]),
    language: z.string().optional().default("text"),
    runnerUrl: z.string().url().optional(),
    maturity: z.enum(["seed", "growing", "evergreen", "archived"]).optional().default("growing"),
    relatedNotes: z.array(z.string()).optional().default([]),
    relatedSnippets: z.array(z.string()).optional().default([]),
    changelog: z
      .array(
        z.object({
          date: z.coerce.date(),
          summary: z.string(),
        }),
      )
      .optional()
      .default([]),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    demoURL: z.string().url().optional(),
    repoURL: z.string().url().optional(),
    tags: z.array(z.string()).optional().default([]),
    stack: z.array(z.string()).optional().default([]),
    roles: z.array(z.string()).optional().default([]),
    outcomes: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { blog, projects, notes, snippets };
