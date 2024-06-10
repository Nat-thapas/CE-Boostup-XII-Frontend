import { PUBLIC_ORIGIN } from '$env/static/public';

export function parseBaseUrl(pathname: string, base: string): string {
	if (base.startsWith('/')) {
		return base;
	}
	const url = new URL(base, PUBLIC_ORIGIN + pathname);
	return url.pathname;
}
