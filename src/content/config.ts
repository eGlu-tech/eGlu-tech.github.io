import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.string(), // We can use z.date() later, but keeping it as string for now to match your format
		author: z.string().optional(),
	}),
});

export const collections = { blog };
