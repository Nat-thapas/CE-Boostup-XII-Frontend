import { redirect, type Handle } from '@sveltejs/kit';

import { base } from '$app/paths';
import { PUBLIC_API_URL } from '$env/static/public';

import type { User } from '$lib/intefaces/user.interface';
import { parseCookies } from '$lib/parse-cookies';

export const handle: Handle = async ({ event, resolve }) => {
	const cookie = event.request.headers.get('cookie');
	const token = cookie ? parseCookies(cookie).token ?? '' : '';

	let user: User | null = null;
	event.locals.token = '';

	let reason = 'You need to login to access this page.';

	if (token) {
		reason = 'Your session has expired. Please login again.';

		const response = await fetch(`${PUBLIC_API_URL}/users/me`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
		if (response.ok) {
			user = await response.json();
			event.locals.token = token;
		}
	}

	if (!user?.id && !event.url.pathname.startsWith(`${base}/auth`)) {
		throw redirect(
			303,
			`${base}/auth/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}&reason=${encodeURIComponent(reason)}`
		);
	}

	event.locals.user = user as User;

	const response = await resolve(event);

	if (event.locals.token !== token) {
		response.headers.append(
			'set-cookie',
			`token=${event.locals.token}; Path=/; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`
		);
	}

	return response;
};
