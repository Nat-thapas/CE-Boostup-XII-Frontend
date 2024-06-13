import { PUBLIC_API_URL } from '$env/static/public';

export async function replaceUUIDWithTile(pathname: string, token: string): Promise<string> {
	const paths = pathname.split('/');
	for (const [i, path] of paths.entries()) {
		const match = path.match(
			/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
		);
		if (match) {
			if (i > 0 && paths[i - 1] === 'problems') {
				const problemResponse = await fetch(`${PUBLIC_API_URL}/problems/${match[0]}`, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				});

				if (!problemResponse.ok) {
					return pathname;
				}

				const problem = await problemResponse.json();
				paths[i] = problem.title;
			}
		}
	}

	return paths.join('/');
}
