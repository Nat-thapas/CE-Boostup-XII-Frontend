export function format(
	num: number,
	space: boolean = true,
	above: number = 0,
	below: number = 0,
	digits: number = 3
): string {
	if (num === 0) {
		return '0';
	}
	if (num > below && num < above) {
		while (num < Math.pow(0.1, digits)) {
			digits++;
		}
		return num.toLocaleString('en-US', { maximumFractionDigits: digits });
	}
	const lookup = [
		{ value: 1e-30, symbol: 'q' },
		{ value: 1e-27, symbol: 'r' },
		{ value: 1e-24, symbol: 'y' },
		{ value: 1e-21, symbol: 'z' },
		{ value: 1e-18, symbol: 'a' },
		{ value: 1e-15, symbol: 'f' },
		{ value: 1e-12, symbol: 'p' },
		{ value: 1e-9, symbol: 'n' },
		{ value: 1e-6, symbol: 'µ' },
		{ value: 1e-3, symbol: 'm' },
		{ value: 1, symbol: '' },
		{ value: 1e3, symbol: 'k' },
		{ value: 1e6, symbol: 'M' },
		{ value: 1e9, symbol: 'G' },
		{ value: 1e12, symbol: 'T' },
		{ value: 1e15, symbol: 'P' },
		{ value: 1e18, symbol: 'E' },
		{ value: 1e21, symbol: 'Z' },
		{ value: 1e24, symbol: 'Y' },
		{ value: 1e27, symbol: 'R' },
		{ value: 1e30, symbol: 'Q' }
	];
	const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
	const exponentialRegexp = /\.0+(?=e)|(?<=\.[0-9]*[1-9])0+(?=e)/;
	const item = lookup.findLast((item) => num >= item.value && num < item.value * 1e3);
	return item
		? (num / item.value)
				.toFixed(digits)
				.replace(regexp, '')
				.concat((space ? ' ' : '') + item.symbol)
		: num.toExponential(digits).replace(exponentialRegexp, '');
}
