export function parseCookies(cookie: string) {
	return Object.fromEntries(
		cookie.split(/\; */).map((v) => {
			const [key, ...vs] = v.split('=');
			return [key.trim(), vs.join('=')];
		})
	);
}
