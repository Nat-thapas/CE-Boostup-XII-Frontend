import { PUBLIC_API_URL } from '$env/static/public';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: {
			...locals.user,
			avatarUrl: `${PUBLIC_API_URL}/users/${locals.user.id}/avatar`
		}
	};
};
