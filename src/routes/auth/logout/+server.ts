import { redirect } from '@sveltejs/kit';

import { base } from '$app/paths';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	locals.token = '';
	redirect(303, `${base}/auth/login`);
};
