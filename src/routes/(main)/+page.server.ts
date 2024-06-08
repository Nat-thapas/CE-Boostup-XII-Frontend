import type { Actions } from '@sveltejs/kit';
import { fail, message, superValidate, type Infer } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { PUBLIC_API_URL } from '$env/static/public';

import type { Message } from '$lib/intefaces/form-message.interface';
import { formSchema } from '$lib/schemas/edit-profile.schema';
import { toBase64 } from '$lib/server/file-to-base64';

export const actions: Actions = {
	edit_profile: async (event) => {
		const form = await superValidate<Infer<typeof formSchema>, Message>(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const body: {
			displayName?: string;
			oldPassword?: string;
			password?: string;
			confirmPassword?: string;
			bio?: string;
			avatar?: string;
		} = {};

		if (form.data.displayName) {
			body.displayName = form.data.displayName;
		}

		if (form.data.password) {
			body.oldPassword = form.data.oldPassword;
			body.password = form.data.password;
			body.confirmPassword = form.data.confirmPassword;
		}

		if (form.data.bio) {
			body.bio = form.data.bio;
		}

		if (form.data.avatar) {
			body.avatar = `data:${form.data.avatar.type};base64,` + (await toBase64(form.data.avatar));
		}

		const response = await fetch(`${PUBLIC_API_URL}/users/${event.url.searchParams.get('id')}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ' + event.locals.token
			},
			body: JSON.stringify(body)
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

		return message(form, {
			status: 'success',
			message: 'Profile updated successfully!'
		});
	}
};
