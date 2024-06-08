import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate, type Infer } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { base } from '$app/paths';
import { PUBLIC_API_URL } from '$env/static/public';

import type { Message } from '$lib/intefaces/form-message.interface';
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
		const form = await superValidate<Infer<typeof formSchema>, Message>(event, zod(formSchema));

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
			return message(
				form,
				{
					status: 'error',
					message: data.message
				},
				{
					status: 400
				}
			);
		}

		redirect(302, `${base}/`);
	}
};
