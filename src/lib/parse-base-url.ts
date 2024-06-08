export function parseBaseUrl(pathname: string, base: string): string {
	if (base.startsWith('..')) {
		throw new Error('Base URL cannot go up a directory');
	}
	return base.startsWith('/')
		? base
		: base.startsWith('.')
			? `${pathname}${base.slice(1)}`
			: `${pathname}/${base}`;
}
