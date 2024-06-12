export function isAllNestedUndefined(obj: object | undefined | null): boolean {
	if (obj === undefined || obj === null) {
		return true;
	}
	return Object.values(obj).every((value) => {
		if (typeof value === 'object' && value !== null) {
			return isAllNestedUndefined(value);
		}
		return value === undefined;
	});
}
