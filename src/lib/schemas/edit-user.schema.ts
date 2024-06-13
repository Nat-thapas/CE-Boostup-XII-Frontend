import { z } from 'zod';

import { PUBLIC_ACCEPTED_IMAGE_TYPES } from '$env/static/public';

import { Role } from '$lib/enums/role.enum';

export const formSchema = z
	.object({
		id: z.string().uuid(),
		displayName: z
			.string()
			.min(3, 'Display name must be at least 3 characters long')
			.max(32, 'Display name must be at most 32 characters long'),
		email: z.string().email(),
		roles: z.array(z.nativeEnum(Role)),
		group: z.string().or(z.literal(null)).optional(),
		bio: z.string().max(16383, 'Bio must be at most 16383 characters long').optional(),
		avatar: z
			.instanceof(File, { message: 'Avatar must be a file' })
			.refine((f) => f.size < 5 * 1024 * 1024, 'Max 5 MiB upload size.')
			.refine((f) => {
				return PUBLIC_ACCEPTED_IMAGE_TYPES.includes(f.type);
			}, 'Only .jpg, .jpeg, .png, .svg, .gif, .webp and .avif files are accepted.')
			.optional(),
		password: z.string().min(8, 'Password must be at least 8 characters long').or(z.literal('')),
		confirmPassword: z.string().optional()
	})
	.superRefine(({ password }, checkPasswordComplexity) => {
		if (!password) {
			return;
		}
		if (!password.match(/[A-Z]/)) {
			checkPasswordComplexity.addIssue({
				code: 'custom',
				path: ['password'],
				message: 'Password must contain at least one uppercase letter'
			});
		}
		if (!password.match(/[a-z]/)) {
			checkPasswordComplexity.addIssue({
				code: 'custom',
				path: ['password'],
				message: 'Password must contain at least one lowercase letter'
			});
		}
		if (!password.match(/[0-9]/)) {
			checkPasswordComplexity.addIssue({
				code: 'custom',
				path: ['password'],
				message: 'Password must contain at least one number'
			});
		}
		if (!password.match(/[^a-zA-Z0-9]/)) {
			checkPasswordComplexity.addIssue({
				code: 'custom',
				path: ['password'],
				message: 'Password must contain at least one special character'
			});
		}
	})
	.superRefine(({ password, confirmPassword }, checkPasswordMatch) => {
		if (!password && !confirmPassword) {
			return;
		}
		if (password !== confirmPassword) {
			checkPasswordMatch.addIssue({
				code: 'custom',
				path: ['confirmPassword'],
				message: 'Passwords do not match'
			});
		}
	});

export type FormSchema = typeof formSchema;
