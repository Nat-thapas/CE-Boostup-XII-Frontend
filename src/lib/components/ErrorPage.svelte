<script lang="ts">
	import { TriangleAlert } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	let className: string = '';
	export { className as class };
	export let status: number;
	export let message: string | undefined;
</script>

<div class={cn('mt-20 text-center', className)}>
	<div class="mb-8 flex justify-center">
		<TriangleAlert size={192} />
	</div>
	<h1 class="mb-4 text-6xl font-extrabold">{status}</h1>
	<h2 class="text-2xl font-semibold">{message ?? 'Unknown error'}</h2>
</div>
