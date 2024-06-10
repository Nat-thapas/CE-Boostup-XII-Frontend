<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { parseBaseUrl } from '$lib/parse-base-url';

	let className: string | undefined = undefined;
	export { className as class };

	$: baseUrl = parseBaseUrl($page.url.pathname, base);

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
			href: `${base}/${pathname
				.split('/')
				.slice(1, i + 2)
				.join('/')}`
		}));

	$: console.log(
		'actualpathname:',
		$page.url.pathname,
		'actualbaseurl:',
		base,
		'pathname:',
		pathname,
		'baseurl:',
		baseUrl,
		'currentpagename:',
		currentPageName,
		items
	);
</script>

<Breadcrumb.Root class={className}>
	<Breadcrumb.List>
		{#if currentPageName}
			<Breadcrumb.Item>
				<Breadcrumb.Link href={`${base}/`} class="text-base font-medium"
					>CE Boostup XII</Breadcrumb.Link
				>
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
