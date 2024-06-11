export function setSearchParams(
	search: string,
	params: Record<string, string | number | null | undefined>
) {
	const url = new URLSearchParams(search);
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined) {
			url.delete(key);
		} else {
			url.set(key, value === null ? '' : String(value));
		}
	}
	return url.toString();
}
