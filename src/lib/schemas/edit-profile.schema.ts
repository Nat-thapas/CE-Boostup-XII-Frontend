import { z } from 'zod';

import { PUBLIC_ACCEPTED_IMAGE_TYPES } from '$env/static/public';

export const formSchema = z
	.object({
		displayName: z
			.string()
			.min(3, 'Display name must be at least 3 characters long')
			.max(32, 'Display name must be at most 32 characters long')
			.optional(),
		bio: z.string().max(16383, 'Bio must be at most 16383 characters long').optional(),
		avatar: z
			.any()
			.refine((f) => {
				if (f instanceof File) {
					return true;
				}
				return f.length === 1;
			}, 'Only one file can be uploaded at a time.')
			.refine((f) => {
				if (f instanceof File) {
					return f.size <= 5 * 1024 * 1024;
				}
				return f[0].size <= 5 * 1024 * 1024;
			}, 'Max 5 MiB upload size.')
			.refine((f) => {
				if (f instanceof File) {
					return PUBLIC_ACCEPTED_IMAGE_TYPES.includes(f.type);
				}
				return PUBLIC_ACCEPTED_IMAGE_TYPES.includes(f[0].type);
			}, 'Only .jpg, .jpeg, .png, .svg, .gif, .webp and .avif files are accepted.')
			.optional(),
		oldPassword: z.string().optional(),
		password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
		confirmPassword: z.string().optional()
	})
	.superRefine(({ oldPassword, password }, checkOldPassword) => {
		if (!oldPassword && password) {
			checkOldPassword.addIssue({
				code: 'custom',
				path: ['oldPassword'],
				message: 'Old password is required to change password'
			});
		}
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
		if (!password || !confirmPassword) {
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
