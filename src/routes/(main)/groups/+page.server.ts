import { error, type Actions } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { PRIVATE_API_URL } from '$env/static/private';

import type { Group } from '$lib/intefaces/group.interface';
import type { PaginatedResponse } from '$lib/intefaces/pagination.interface';
import { formSchema as createGroupFormSchema } from '$lib/schemas/create-group.schema';
import { formSchema as editGroupFormSchema } from '$lib/schemas/edit-group.schema';
import { toBase64 } from '$lib/server/file-to-base64';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const searchParams: Record<string, string | undefined> = {
		sort: url.searchParams.get('sort') ?? 'name',
		page: url.searchParams.get('page') ?? '1',
		perPage: url.searchParams.get('perPage') ?? '100',
		search: url.searchParams.get('search') ?? undefined
	};

	for (const key in searchParams) {
		if (searchParams[key] === undefined) {
			delete searchParams[key];
		}
	}

	const groupsResponsePromise = fetch(
		`${PRIVATE_API_URL}/groups?` + new URLSearchParams(searchParams as Record<string, string>),
		{
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${locals.token}`
			}
		}
	);

	const groupsResponse = await groupsResponsePromise;

	if (!groupsResponse.ok) {
		error(400, 'Failed to fetch groups');
	}

	return {
		params: searchParams,
		groups: (await groupsResponse.json()) as PaginatedResponse<Group>,
		createGroupForm: await superValidate(zod(createGroupFormSchema)),
		editGroupForm: await superValidate(zod(editGroupFormSchema))
	};
};

export const actions: Actions = {
	create_group: async (event) => {
		const form = await superValidate(event, zod(createGroupFormSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const body: {
			name?: string;
			description?: string;
			avatar?: string;
		} = {
			name: form.data.name,
			description: form.data.description
		};

		if (form.data.avatar) {
			body.avatar = `data:${form.data.avatar.type};base64,` + (await toBase64(form.data.avatar));
		}

		const response = await fetch(`${PRIVATE_API_URL}/groups`, {
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
						case 'name':
							form.errors.name = [data.errors.name];
							break;
						case 'description':
							form.errors.description = [data.errors.description];
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
			text: 'Group created successfully!'
		});
	},

	edit_group: async (event) => {
		const form = await superValidate(event, zod(editGroupFormSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const body: {
			name?: string;
			description?: string;
			avatar?: string;
		} = {
			name: form.data.name,
			description: form.data.description
		};

		if (form.data.avatar) {
			body.avatar = `data:${form.data.avatar.type};base64,` + (await toBase64(form.data.avatar));
		}

		const response = await fetch(`${PRIVATE_API_URL}/groups/${form.data.id}`, {
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
						case 'name':
							form.errors.name = [data.errors.name];
							break;
						case 'description':
							form.errors.description = [data.errors.description];
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
			text: 'Group updated successfully!'
		});
	}
};
