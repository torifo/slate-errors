import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const errorCategory = z.enum(['informational', 'success', 'redirection', 'client', 'server']);

const commonCause = z.object({
  title: z.string(),
  hint: z.string().optional(),
});

const referenceLink = z.object({
  label: z.string(),
  url: z.string().url(),
  source: z.enum(['rfc', 'mdn', 'other']).default('other'),
});

const errors = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!**/_*.mdx'], base: './src/content/errors' }),
  schema: z.object({
    code: z.number().int().min(100).max(599),
    name: z.string(),
    nameJa: z.string(),
    category: errorCategory,
    summary: z.string().max(120),
    synonyms: z.array(z.string()).default([]),
    related: z.array(z.number().int()).default([]),
    commonCauses: z.array(commonCause).max(3).default([]),
    references: z.array(referenceLink).default([]),
    popular: z.boolean().default(false),
    draft: z.boolean().default(false),
    updatedAt: z.coerce.date().optional(),
    rfc: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const collections = { errors };
