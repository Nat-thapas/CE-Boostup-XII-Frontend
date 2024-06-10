import type { CompletionStatus } from '$lib/enums/completion-status.enum';
import type { OptimizationLevel } from '$lib/enums/optimization-level.enum';
import type { ProgrammingLanguage } from '$lib/enums/programming-language.enum';
import type { PublicationStatus } from '$lib/enums/publication-status.enum';

export interface Problem {
	id: string;
	number?: number;
	title?: string;
	description?: string;
	input?: string;
	output?: string;
	hint?: string;
	hintCost?: number;
	testcases?: { input: string; output: string }[];
	exampleTestcases?: { input: string; output: string }[];
	starterCode?: string;
	solution?: string;
	solutionLanguage?: ProgrammingLanguage;
	allowedHeaders?: string[] | null;
	bannedFunctions?: string[];
	timeLimit?: number;
	memoryLimit?: number;
	difficulty?: number;
	score?: number;
	optimizationLevel?: OptimizationLevel;
	attachments?: {
		id: string;
		name: string;
		type: string;
		size: number;
		url: string;
	}[];
	tags?: { id: string; name: string }[];
	owner?: { id: string; displayName: string };
	credits?: string;
	publicationStatus?: PublicationStatus;
	reviewer?: { id: string; displayName: string };
	reviewComment?: string;
	completionStatus?: CompletionStatus;
	userSolvedCount?: number;
	createdAt?: Date;
	updatedAt?: Date;
}
