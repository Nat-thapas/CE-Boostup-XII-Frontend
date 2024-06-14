export function parseCookies(cookie: string): Record<string, string> {
	return Object.fromEntries(
		cookie.split(/; */).map((v) => {
			const [key, ...vs] = v.split('=');
			return [key.trim(), vs.join('=')];
		})
	);
}
