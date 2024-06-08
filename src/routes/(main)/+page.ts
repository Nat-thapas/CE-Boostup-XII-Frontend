import { PUBLIC_API_URL } from '$env/static/public';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	return {
		hello: await (await fetch(PUBLIC_API_URL)).text()
	};
};
