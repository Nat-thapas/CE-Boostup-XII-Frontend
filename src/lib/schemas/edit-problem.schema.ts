import { z } from 'zod';

import { OptimizationLevel } from '$lib/enums/optimization-level.enum';
import { ProgrammingLanguage } from '$lib/enums/programming-language.enum';
import { PublicationStatus } from '$lib/enums/publication-status.enum';

export const formSchema = z
	.object({
		title: z
			.string()
			.min(1, 'Title must be at least 1 characters long')
			.max(255, 'Title must be at most 255 characters long'),
		description: z
			.string()
			.max(16383, 'Description must be at most 16383 characters long')
			.optional(),
		input: z.string().max(16383, 'Input must be at most 16383 characters long').optional(),
		output: z.string().max(16383, 'Output must be at most 16383 characters long').optional(),
		hint: z.string().max(16383, 'Hint must be at most 16383 characters long').optional(),
		hintCost: z.coerce.number().int().min(0, 'Hint cost must be at least 0').optional(),
		testcases: z
			.array(
				z.object({
					input: z
						.string()
						.max(16777216, 'Testcase input must be at most 16,777,216 characters long'),
					output: z
						.string()
						.max(16777216, 'Testcase output must be at most 16,777,216 characters long')
				})
			)
			.min(1, 'At least one testcase is required')
			.max(64, 'At most 64 testcases are allowed'),
		exampleTestcases: z
			.array(
				z.object({
					input: z
						.string()
						.max(16777216, 'Example testcase input must be at most 16,777,216 characters long'),
					output: z
						.string()
						.max(16777216, 'Example testcase output must be at most 16,777,216 characters long')
				})
			)
			.max(16, 'At most 16 example testcases are allowed')
			.optional(),
		starterCode: z
			.string()
			.max(32767, 'Starter code must be at most 32,767 characters long')
			.optional(),
		solution: z.string().max(32767, 'Solution must be at most 32,767 characters long'),
		solutionLanguage: z.nativeEnum(ProgrammingLanguage),
		allowedHeaders: z.array(z.string()).optional(),
		allowAllHeaders: z.boolean().optional(),
		bannedFunctions: z.array(z.string()).optional(),
		timeLimit: z.coerce
			.number()
			.positive('Time limit must be positive')
			.max(5, 'Time limit must be at most 5 seconds')
			.optional(),
		memoryLimit: z.coerce
			.number()
			.positive('Memory limit must be positive')
			.int()
			.max(134217728, 'Memory limit must be at most 128 MiB')
			.optional(),
		difficulty: z
			.number()
			.int()
			.min(1, 'Difficulty must be at least 1')
			.max(5, 'Difficulty must be at most 5'),
		score: z.coerce.number().int().min(0, 'Score must be at least 0'),
		optimizationLevel: z.nativeEnum(OptimizationLevel).optional(),
		attachments: z
			.instanceof(File, { message: 'Attachments must be files' })
			.refine((file) => file.size <= 83886080, 'Attachments must be at most 80 MiB')
			.array()
			.max(8, 'At most 8 attachments are allowed')
			.optional(),
		tags: z.array(z.string()).optional(),
		credits: z.string().max(255, 'Credits must be at most 255 characters long').optional(),
		oldAttachments: z
			.array(
				z.object({
					id: z.string(),
					name: z.string().optional(),
					type: z.string().optional(),
					size: z.number().optional(),
					url: z.string().optional()
				})
			)
			.optional(),
		publicationStatus: z.nativeEnum(PublicationStatus),
		reviewComment: z
			.string()
			.max(16383, 'Review comment must be at most 16383 characters long')
			.optional()
	})
	.superRefine(({ hint, hintCost }, checkHintCost) => {
		if (hint && hintCost === undefined) {
			checkHintCost.addIssue({
				code: 'custom',
				path: ['hintCost'],
				message: 'Hint cost is required when hint is provided'
			});
		}
	});

export type FormSchema = typeof formSchema;
