// See https://kit.svelte.dev/docs/types#app

import type { User } from '$lib/intefaces/user.interface';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User;
			token: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		namespace Superforms {
			type Message = {
				type: 'success' | 'warning' | 'error';
				text: string;
			};
		}
	}
}

export {};
