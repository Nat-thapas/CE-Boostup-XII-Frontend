import { error } from '@sveltejs/kit';

import { PUBLIC_API_URL } from '$env/static/public';

import type { Problem } from '$lib/intefaces/problem.interface';
import type { Save } from '$lib/intefaces/save.interface';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const problemResponsePromise = fetch(`${PUBLIC_API_URL}/problems/${params.id}`, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${locals.token}`
		}
	});

	const saveResponsePromise = fetch(`${PUBLIC_API_URL}/saves/for-problem/${params.id}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${locals.token}`
		}
	});

	let code: string | undefined;

	const saveResponse = await saveResponsePromise;
	if (saveResponse.ok) {
		const save = (await saveResponse.json()) as Save;
		code = save.code;
	}

	const problemResponse = await problemResponsePromise;
	if (!problemResponse.ok) {
		error(404, 'Problem not found');
	}

	const problem = (await problemResponse.json()) as Problem;

	if (code === undefined) {
		code = problem.starterCode ?? '';
	}

	return {
		problem,
		code
	};
};
