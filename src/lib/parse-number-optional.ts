export function parseNumberOptional(value: undefined): undefined;
export function parseNumberOptional(value: string | number | null): number;
export function parseNumberOptional(value?: string | number | null): number | undefined {
	if (value === undefined) return undefined;
	if (value === null) return 0;
	return +value;
}
