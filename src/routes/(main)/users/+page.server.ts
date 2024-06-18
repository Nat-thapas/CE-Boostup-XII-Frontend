import { error, type Actions } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { PRIVATE_API_URL } from '$env/static/private';

import type { Group } from '$lib/intefaces/group.interface';
import type { PaginatedResponse } from '$lib/intefaces/pagination.interface';
import type { User } from '$lib/intefaces/user.interface';
import { formSchema as createUserFormSchema } from '$lib/schemas/create-user.schema';
import { formSchema as editUserFormSchema } from '$lib/schemas/edit-user.schema';
import { toBase64 } from '$lib/server/file-to-base64';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const groupsResponsePromise = fetch(
		`${PRIVATE_API_URL}/groups?` +
			new URLSearchParams({
				sort: 'name',
				perPage: '1000'
			}),
		{
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${locals.token}`
			}
		}
	);

	const searchParams: Record<string, string | undefined> = {
		sort: url.searchParams.get('sort') ?? 'displayName',
		page: url.searchParams.get('page') ?? '1',
		perPage: url.searchParams.get('perPage') ?? '100',
		search: url.searchParams.get('search') ?? undefined,
		roles: url.searchParams.get('roles') ?? undefined,
		group: url.searchParams.get('group') ?? undefined
	};

	for (const key in searchParams) {
		if (searchParams[key] === undefined) {
			delete searchParams[key];
		}
	}

	const usersResponsePromise = fetch(
		`${PRIVATE_API_URL}/users?` + new URLSearchParams(searchParams as Record<string, string>),
		{
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${locals.token}`
			}
		}
	);

	const usersResponse = await usersResponsePromise;

	if (!usersResponse.ok) {
		error(400, 'Failed to fetch users');
	}

	const groupsResponse = await groupsResponsePromise;

	if (!groupsResponse.ok) {
		error(500, 'Failed to fetch groups');
	}

	return {
		params: searchParams,
		users: (await usersResponse.json()) as PaginatedResponse<User>,
		groups: (await groupsResponse.json()) as PaginatedResponse<Group>,
		createUserForm: await superValidate(zod(createUserFormSchema)),
		editUserForm: await superValidate(zod(editUserFormSchema))
	};
};

export const actions: Actions = {
	create_user: async (event) => {
		const form = await superValidate(event, zod(createUserFormSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const body: {
			displayName?: string;
			email?: string;
			roles?: string[];
			group?: string | null;
			password?: string;
		} = {
			displayName: form.data.displayName,
			email: form.data.email,
			roles: form.data.roles
		};

		if (form.data.group !== undefined) {
			body.group = form.data.group === '' ? null : form.data.group;
		}

		if (form.data.password) {
			body.password = form.data.password;
		}

		const response = await fetch(`${PRIVATE_API_URL}/users`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${event.locals.token}`
			},
			body: JSON.stringify(body)
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
						case 'displayName':
							form.errors.displayName = [data.errors.displayName];
							break;
						case 'password':
							form.errors.password = [data.errors.password];
							break;
						default:
							errorMessage = data.message;
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
			text: 'User created successfully!'
		});
	},

	edit_user: async (event) => {
		const form = await superValidate(event, zod(editUserFormSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const body: {
			displayName?: string;
			email?: string;
			roles?: string[];
			bio?: string;
			group?: string | null;
			avatar?: string;
			oldPassword?: string;
			password?: string;
		} = {
			displayName: form.data.displayName,
			email: form.data.email,
			roles: form.data.roles,
			bio: form.data.bio
		};

		if (form.data.group !== undefined) {
			body.group = form.data.group === '' ? null : form.data.group;
		}

		if (form.data.password) {
			body.oldPassword = '';
			body.password = form.data.password;
		}

		if (form.data.avatar) {
			body.avatar = `data:${form.data.avatar.type};base64,` + (await toBase64(form.data.avatar));
		}

		const response = await fetch(`${PRIVATE_API_URL}/users/${form.data.id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${event.locals.token}`
			},
			body: JSON.stringify(body)
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
						case 'displayName':
							form.errors.displayName = [data.errors.displayName];
							break;
						case 'password':
							form.errors.password = [data.errors.password];
							break;
						case 'bio':
							form.errors.bio = [data.errors.bio];
							break;
						case 'avatar':
							form.errors.avatar = [data.errors.avatar];
							break;
						default:
							errorMessage = data.message;
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
			text: 'User updated successfully!'
		});
	}
};
