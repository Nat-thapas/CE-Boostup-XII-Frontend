export interface ProblemTag {
	id: string;
	name?: string;
	description?: string;
	owner?: { id: string; displayName: string };
	createdAt?: Date;
	updatedAt?: Date;
}
