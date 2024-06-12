import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { PUBLIC_API_URL } from '$env/static/public';

import { formSchema } from '$lib/schemas/edit-profile.schema';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		editProfileForm: await superValidate(zod(formSchema)),
		user: {
			...locals.user,
			avatarUrl: `${PUBLIC_API_URL}/users/${locals.user.id}/avatar`
		},
		token: locals.token
	};
};
