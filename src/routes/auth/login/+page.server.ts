import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { base } from '$app/paths';
import { PUBLIC_API_URL } from '$env/static/public';

import { formSchema } from '$lib/schemas/login.schema';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return {
		next: url.searchParams.get('next') || `${base}/`,
		reason: url.searchParams.get('reason') || '',
		form: await superValidate(zod(formSchema))
	};
};

export const actions: Actions = {
	login: async (event) => {
		const form = await superValidate(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const response = await fetch(`${PUBLIC_API_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: form.data.email,
				password: form.data.password
			})
		});

		if (!response.ok) {
			form.errors.email = ['Invalid email or password'];
			form.errors.password = ['Invalid email or password'];
			return fail(response.status, {
				form
			});
		}

		const { token } = await response.json();

		event.locals.token = token;

		redirect(302, event.url.searchParams.get('next') || `${base}/`);
	}
};
