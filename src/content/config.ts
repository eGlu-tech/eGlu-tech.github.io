import { defineCollection, reference, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.string(),
		author: reference('author'),
	}),
});

const author = defineCollection({
	type: 'content',
	schema: z.object({
		name: z.string(),
		github: z.string().url(),
	}),
});

export const collections = { blog, author };
