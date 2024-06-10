import type { ProgrammingLanguage } from '$lib/enums/programming-language.enum';

export interface Submission {
	id: string;
	owner?: { id: string; displayName: string };
	problem?: { id: string; title: string };
	code?: string;
	language?: ProgrammingLanguage;
	outputCodes?: string[];
	accepted?: boolean;
	compilationTime?: number;
	compilationMemory?: number;
	executionTime?: number;
	executionMemory?: number;
	createdAt?: Date;
}
