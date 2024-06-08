import type { Role } from '$lib/enums/role.enum';

export interface User {
	id: string;
	email?: string;
	roles?: Role[];
	displayName?: string;
	bio?: string;
	group?: { id: string; name: string } | null;
	totalScore?: number;
	problemSolvedCount?: number;
	lastProblemSolvedAt?: Date;
	lastEmailRequestedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}
