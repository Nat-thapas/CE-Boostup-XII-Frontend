import { z } from 'zod';

export const formSchema = z
	.object({
		displayName: z
			.string()
			.min(3, 'Display name must be at least 3 characters long')
			.max(32, 'Display name must be at most 32 characters long'),
		password: z.string().min(8, 'Password must be at least 8 characters long'),
		confirmPassword: z.string()
	})
	.superRefine(({ password }, checkPasswordComplexity) => {
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
		if (password !== confirmPassword) {
			checkPasswordMatch.addIssue({
				code: 'custom',
				path: ['confirmPassword'],
				message: 'Passwords do not match'
			});
		}
	});

export type FormSchema = typeof formSchema;
