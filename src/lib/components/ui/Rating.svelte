<script lang="ts">
	import { Star } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	let className: string = '';
	export { className as class };

	export let full: number = 5;
	export let value: number;
	export let fillColor: string = '#E2AD39';
	export let strokeColor: string = '#E2AD39';
	export let size: number = 16;

	$: filled = Math.min(full, Math.max(0, value));
	$: empty = full - filled;
</script>

<div class={cn('flex space-x-1', className)}>
	{#each Array(filled) as _}
		<Star color={strokeColor} {size} fill={fillColor} />
	{/each}
	{#each Array(empty) as _}
		<Star color={strokeColor} {size} />
	{/each}
</div>
