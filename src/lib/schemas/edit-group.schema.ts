import { z } from 'zod';

import { PUBLIC_ACCEPTED_IMAGE_TYPES } from '$env/static/public';

export const formSchema = z.object({
	id: z.string().uuid(),
	name: z
		.string()
		.min(3, 'Display name must be at least 3 characters long')
		.max(32, 'Display name must be at most 32 characters long'),
	description: z
		.string()
		.max(16383, 'Description must be at most 16383 characters long')
		.optional(),
	avatar: z
		.instanceof(File, { message: 'Avatar must be a file' })
		.refine((f) => f.size < 5 * 1024 * 1024, 'Max 5 MiB upload size.')
		.refine((f) => {
			return PUBLIC_ACCEPTED_IMAGE_TYPES.includes(f.type);
		}, 'Only .jpg, .jpeg, .png, .svg, .gif, .webp and .avif files are accepted.')
		.optional()
});

export type FormSchema = typeof formSchema;
