import { z } from 'zod';

export const formSchema = z
	.object({
		email: z.string().email(),
		password: z.string().min(8)
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
	});

export type FormSchema = typeof formSchema;
