import { PUBLIC_API_URL } from '$env/static/public';

import type { PaginatedResponse } from '$lib/intefaces/pagination.interface';
import type { Problem } from '$lib/intefaces/problem.interface';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const problems = fetch(`${PUBLIC_API_URL}/problems?sort=number`, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${locals.token}`
		}
	});
	return {
		user: locals.user,
		problems: (await (await problems).json()) as PaginatedResponse<Problem>
	};
};
