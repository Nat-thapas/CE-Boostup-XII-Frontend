import type { Actions } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { PUBLIC_API_URL } from '$env/static/public';

import { formSchema } from '$lib/schemas/edit-profile.schema';
import { toBase64 } from '$lib/server/file-to-base64';

export const actions: Actions = {
	edit_profile: async (event) => {
		const form = await superValidate(event, zod(formSchema));

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
		} = {
			displayName: form.data.displayName,
			bio: form.data.bio
		};

		if (form.data.password) {
			body.oldPassword = form.data.oldPassword;
			body.password = form.data.password;
			body.confirmPassword = form.data.confirmPassword;
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
			let errorMessage: string | string[] | undefined;
			if (data.errors) {
				for (const key in data.errors) {
					switch (key) {
						case 'displayName':
							form.errors.displayName = [data.errors.displayName];
							break;
						case 'oldPassword':
							form.errors.oldPassword = [data.errors.oldPassword];
							break;
						case 'password':
							form.errors.password = [data.errors.password];
							break;
						case 'confirmPassword':
							form.errors.confirmPassword = [data.errors.confirmPassword];
							break;
						case 'bio':
							form.errors.bio = [data.errors.bio];
							break;
						case 'avatar':
							form.errors.avatar = [data.errors.avatar];
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
			text: 'Profile updated successfully!'
		});
	}
};
