import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { base } from '$app/paths';
import { PRIVATE_API_URL } from '$env/static/private';

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

		const response = await fetch(`${PRIVATE_API_URL}/auth/login`, {
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
			const data = await response.json();
			let errorMessage: string | string[] | undefined;
			if (data.errors) {
				for (const key in data.errors) {
					switch (key) {
						case 'email':
							form.errors.email = [data.errors.email];
							break;
						case 'password':
							form.errors.password = [data.errors.password];
							break;
						default:
							errorMessage = data.message;
							break;
					}
				}
			} else {
				errorMessage = data.message;
			}

			if (errorMessage) {
				errorMessage = errorMessage instanceof Array ? errorMessage.join(', ') : errorMessage;
				return message(
					form,
					{
						type: 'error',
						text: errorMessage
					},
					{
						status: 400
					}
				);
			} else {
				return fail(400, {
					form
				});
			}
		}

		const { token } = await response.json();

		event.locals.token = token;

		redirect(302, event.url.searchParams.get('next') || `${base}/`);
	}
};
