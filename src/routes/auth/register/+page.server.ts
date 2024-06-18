import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { base } from '$app/paths';
import { PRIVATE_API_URL } from '$env/static/private';
import { PUBLIC_ORIGIN } from '$env/static/public';

import { parseBaseUrl } from '$lib/parse-base-url';
import { formSchema } from '$lib/schemas/register.schema';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod(formSchema))
	};
};

export const actions: Actions = {
	register: async (event) => {
		const form = await superValidate(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const response = await fetch(`${PRIVATE_API_URL}/auth/request-account-creation`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: form.data.email,
				siteUrl: `${PUBLIC_ORIGIN}${parseBaseUrl(event.url.pathname, base)}`
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

		return message(form, {
			type: 'success',
			text: 'Account creation email have been sent! Please check your email to continue.'
		});
	}
};
