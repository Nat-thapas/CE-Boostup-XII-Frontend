export interface Group {
	id: string;
	name?: string;
	description?: string;
	members?: { id: string; displayName: string }[];
	memberCount?: number;
	totalScore?: number;
	uniqueTotalScore?: number;
	problemSolvedCount?: number;
	uniqueProblemSolvedCount?: number;
	lastProblemSolvedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}
