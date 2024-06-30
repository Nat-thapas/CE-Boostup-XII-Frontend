import { error } from '@sveltejs/kit';

import { PRIVATE_API_URL } from '$env/static/private';

import type { PaginatedResponse } from '$lib/intefaces/pagination.interface';
import type { ProblemTag } from '$lib/intefaces/problem-tag.interface';
import type { Problem } from '$lib/intefaces/problem.interface';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const searchParams: Record<string, string | undefined> = {
		sort: url.searchParams.get('sort') ?? 'number',
		page: url.searchParams.get('page') ?? '1',
		perPage: url.searchParams.get('perPage') ?? '100',
		search: url.searchParams.get('search') ?? undefined,
		owner: url.searchParams.get('owner') ?? undefined,
		tags: url.searchParams.get('tags') ?? undefined,
		difficulties: url.searchParams.get('difficulties') ?? undefined,
		publicationStatus: url.searchParams.get('publicationStatus') ?? undefined,
		completionStatus: url.searchParams.get('completionStatus') ?? undefined
	};

	for (const key in searchParams) {
		if (searchParams[key] === undefined) {
			delete searchParams[key];
		}
	}

	const problemsResponsePromise = fetch(
		`${PRIVATE_API_URL}/problems?` + new URLSearchParams(searchParams as Record<string, string>),
		{
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${locals.token}`
			}
		}
	);

	const problemTagsResponsePromise = fetch(
		`${PRIVATE_API_URL}/problem-tags?` +
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

	const problemsResponse = await problemsResponsePromise;
	const problemTagsResponse = await problemTagsResponsePromise;

	if (!problemsResponse.ok) {
		error(400, 'Failed to fetch problems');
	}

	if (!problemTagsResponse.ok) {
		console.error(problemTagsResponse);
		error(500, 'Failed to fetch problem tags');
	}

	return {
		params: searchParams,
		problems: (await problemsResponse.json()) as PaginatedResponse<Problem>,
		problemTags: (await problemTagsResponse.json()) as PaginatedResponse<ProblemTag>
	};
};
