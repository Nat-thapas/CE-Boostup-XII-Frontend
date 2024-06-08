export interface Message {
	status: 'success' | 'warning' | 'error';
	message: string;
}
