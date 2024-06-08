export async function toBase64(file: File): Promise<string> {
	return Buffer.from(await file.arrayBuffer()).toString('base64');
}
