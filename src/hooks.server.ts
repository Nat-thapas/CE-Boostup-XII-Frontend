import { redirect } from '@sveltejs/kit';

import { base } from '$app/paths';
import { PUBLIC_API_URL } from '$env/static/public';

import { parseCookies } from '$lib/parse-cookies';

export async function handle({ event, resolve }) {
	const cookie = event.request.headers.get('cookie');
	const token = cookie ? parseCookies(cookie).token ?? '' : '';

	event.locals.user = null;
	event.locals.token = token;

	if (token) {
		const response = await fetch(`${PUBLIC_API_URL}/users/me`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
		if (response.ok) {
			event.locals.user = await response.json();
		}
	}

	if (!event.locals.user?.id && !event.url.pathname.startsWith(`${base}/auth`)) {
		throw redirect(
			303,
			`${base}/auth/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}&reason=${encodeURIComponent('You need to login to access this page.')}`
		);
	}

	const response = await resolve(event);

	if (event.locals.token !== token) {
		response.headers.append(
			'set-cookie',
			`token=${event.locals.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`
		);
	}

	return response;
}
