import { error } from '@sveltejs/kit';

import { PRIVATE_API_URL } from '$env/static/private';

import type { Problem } from '$lib/intefaces/problem.interface';
import type { Save } from '$lib/intefaces/save.interface';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const problemResponsePromise = fetch(`${PRIVATE_API_URL}/problems/${params.id}`, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${locals.token}`
		}
	});

	const saveResponsePromise = fetch(`${PRIVATE_API_URL}/saves/for-problem/${params.id}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${locals.token}`
		}
	});

	const problemResponse = await problemResponsePromise;
	if (!problemResponse.ok) {
		error(404, 'Problem not found');
	}

	const saveResponse = await saveResponsePromise;

	return {
		problem: (await problemResponse.json()) as Problem,
		save: saveResponse.ok ? ((await saveResponse.json()) as Save) : undefined
	};
};
