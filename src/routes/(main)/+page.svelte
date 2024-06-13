<script lang="ts">
	import { BookText, FileCog, UserRound, UsersRound } from 'lucide-svelte';

	import { base } from '$app/paths';

	const pages = [
		{
			name: 'Run code',
			href: `${base}/compile-and-run`,
			icon: FileCog
		},
		{
			name: 'Problems',
			href: `${base}/problems`,
			icon: BookText
		},
		{
			name: 'Groups',
			href: `${base}/groups`,
			icon: UsersRound
		},
		{
			name: 'Users',
			href: `${base}/users`,
			icon: UserRound
		}
	];
</script>

<svelte:head>
	<title>CE Boostup XII - Dashboard</title>
</svelte:head>

<h1 class="mx-8 mt-8 text-3xl font-semibold">Dashboard</h1>
<h2 class="mx-8 mb-8 text-lg font-normal text-muted-foreground">
	I have no idea what to put here so deal with it
</h2>
<div class="flex flex-wrap justify-evenly gap-8 px-8">
	{#each pages as { name, href, icon }}
		<a {href} class="w-56 flex-grow">
			<div
				class="flex h-24 w-full items-center justify-center space-x-8 rounded-lg bg-muted p-8 hover:bg-neutral-200 dark:hover:bg-neutral-700">
				<svelte:component this={icon} size={48} />
				<h2 class="text-lg font-semibold">{name}</h2>
			</div>
		</a>
	{/each}
</div>
