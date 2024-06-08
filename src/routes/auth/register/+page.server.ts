import { fail } from '@sveltejs/kit';
import { message, superValidate, type Infer } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { PUBLIC_API_URL } from '$env/static/public';

import type { Message } from '$lib/intefaces/form-message.interface';
import { formSchema } from '$lib/schemas/register.schema';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod(formSchema))
	};
};

export const actions: Actions = {
	register: async (event) => {
		const form = await superValidate<Infer<typeof formSchema>, Message>(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const response = await fetch(`${PUBLIC_API_URL}/auth/request-account-creation`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: form.data.email,
				//siteUrl: `${PUBLIC_ORIGIN}${parseBaseUrl(event.url.pathname, base)}`  TODO: Fix this
				siteUrl: 'https://localhostapparentlydoesnotwork.com/grader/v2'
			})
		});

		if (!response.ok) {
			form.errors.email = ['Invalid email'];
			return fail(response.status, {
				form
			});
		}

		return message(form, {
			status: 'success',
			message: 'Account creation email have been sent! Please check your email to continue.'
		});
	}
};
