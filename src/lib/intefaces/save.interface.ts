import type { ProgrammingLanguage } from '$lib/enums/programming-language.enum';

export interface Save {
	id: string;
	owner?: { id: string; displayName: string };
	problem?: { id: string; title: string };
	code?: string;
	language?: ProgrammingLanguage;
	createdAt?: Date;
	updatedAt?: Date;
}
