export interface Attachment {
	id: string;
	name?: string;
	type?: string;
	size?: number;
	url?: string;
	owner?: {
		id: string;
		displayName: string;
	};
	createdAt?: Date;
}
