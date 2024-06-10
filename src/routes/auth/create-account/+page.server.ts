import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate, type Infer } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { base } from '$app/paths';
import { PUBLIC_API_URL } from '$env/static/public';

import { formSchema } from '$lib/schemas/create-account.schema';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return {
		form: await superValidate(zod(formSchema)),
		token: url.searchParams.get('token')
	};
};

export const actions: Actions = {
	create_account: async (event) => {
		const form = await superValidate<Infer<typeof formSchema>>(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const response = await fetch(`${PUBLIC_API_URL}/auth/create-account`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				displayName: form.data.displayName,
				password: form.data.password,
				token: event.url.searchParams.get('token')
			})
		});

		if (!response.ok) {
			const data = await response.json();
			let errorMessage: any;
			if (data.errors) {
				for (const key in data.errors) {
					switch (key) {
						case 'displayName':
							form.errors.displayName = [data.errors.displayName];
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
					{ status: 400 }
				);
			} else {
				return fail(400, {
					form
				});
			}
		}

		redirect(302, `${base}/auth/login`);
	}
};
