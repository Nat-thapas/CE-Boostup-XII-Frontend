export function parseBaseUrl(pageUrl: string, baseUrl: string): string {
	if (baseUrl.startsWith('..')) {
		throw new Error('Base URL cannot go up a directory');
	}
	return baseUrl.startsWith('/')
		? baseUrl
		: baseUrl.startsWith('.')
			? `${pageUrl}${baseUrl.slice(1)}`
			: `${pageUrl}/${baseUrl}`;
}
