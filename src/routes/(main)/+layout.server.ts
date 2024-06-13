import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { formSchema } from '$lib/schemas/edit-profile.schema';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		editProfileForm: await superValidate(zod(formSchema)),
		user: locals.user,
		token: locals.token
	};
};
