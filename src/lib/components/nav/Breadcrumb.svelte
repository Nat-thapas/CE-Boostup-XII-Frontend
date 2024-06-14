<script lang="ts">
	import { onMount } from 'svelte';

	import { base } from '$app/paths';
	import { page } from '$app/stores';

	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { parseBaseUrl } from '$lib/parse-base-url';
	import { replaceUUIDWithTile } from '$lib/replace-UUID-with-title';

	let className: string | undefined = undefined;
	export { className as class };
	export let token: string;

	$: baseUrl = parseBaseUrl($page.url.pathname, base);

	$: originalPathname = $page.url.pathname.slice(baseUrl.length);

	$: pathname = $page.url.pathname.slice(baseUrl.length);

	$: currentPageName = pathname
		.split('/')
		.slice(-1)[0]
		.split('-')
		.map((name) => name.charAt(0).toUpperCase() + name.slice(1))
		.join(' ');

	$: items = pathname
		.split('/')
		.slice(1, -1)
		.map((name, i) => ({
			name: name
				.split('-')
				.map((n) => n.charAt(0).toUpperCase() + n.slice(1))
				.join(' '),
			href: `${base}/${originalPathname
				.split('/')
				.slice(1, i + 2)
				.join('/')}`
		}));

	let mounted = false;

	function updatePathname(path: string, token: string): void {
		replaceUUIDWithTile(path, token).then((newPathname) => {
			pathname = newPathname;
		});
	}

	onMount(() => {
		mounted = true;
	});

	$: if (mounted) updatePathname($page.url.pathname.slice(baseUrl.length), token);
</script>

<Breadcrumb.Root class={className}>
	<Breadcrumb.List>
		{#if currentPageName}
			<Breadcrumb.Item>
				<Breadcrumb.Link href={`${base}/`} class="text-base font-medium">
					CE Boostup XII
				</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
		{/if}
		{#each items as { href, name }}
			<Breadcrumb.Item>
				<Breadcrumb.Link {href} class="text-base font-medium">{name}</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
		{/each}
		{#if currentPageName}
			<Breadcrumb.Item>
				<Breadcrumb.Page class="text-base font-medium">{currentPageName}</Breadcrumb.Page>
			</Breadcrumb.Item>
		{:else}
			<Breadcrumb.Item>
				<Breadcrumb.Page class="text-base font-medium">CE Boostup XII</Breadcrumb.Page>
			</Breadcrumb.Item>
		{/if}
	</Breadcrumb.List>
</Breadcrumb.Root>
