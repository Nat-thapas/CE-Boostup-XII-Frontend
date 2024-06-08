export const getInitial = (name: string): string => {
	const initialsMatch = name.matchAll(/(\p{L}{1})\p{L}+/gu);
	let initials = '';
	for (const match of initialsMatch) {
		initials += match[1];
	}
	initials = initials.toUpperCase();
	if (initials.length > 2) {
		initials = initials.slice(0, 2);
	}
	if (initials.length <= 1) {
		initials = name.slice(0, 2);
	}
	return initials;
};
