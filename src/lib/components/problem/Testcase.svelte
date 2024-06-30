<script lang="ts">
	import Convert from 'ansi-to-html';
	import { escape } from 'html-escaper';
	import { X } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Textarea } from '$lib/components/ui/textarea';
	import { format } from '$lib/format-number';
	import { cn } from '$lib/utils';

	const dispatch = createEventDispatcher();
	const convert = new Convert();

	let className: string = '';
	export { className as class };

	export let number: number;
	export let input: string;
	export let output: string;
	export let time: number | undefined = undefined;
	export let memory: number | undefined = undefined;

	$: outputLines = convert
		.toHtml(escape(output.length > 1048576 ? output.slice(0, 1048576) + '...' : output))
		.split('\n');
</script>

<div class={cn('@container', className)}>
	<div class="ml-2 flex items-center justify-between">
		<div class="flex items-center">
			<p class="mr-3 text-base font-medium @sm:mr-6">Testcase #{number}</p>
			<div class="flex flex-col @sm:flex-row @sm:space-x-4">
				{#if time !== undefined && memory !== undefined}
					<p class="text-sm">Time: {format(time)}s</p>
					<p class="text-sm">Memory: {format(memory)}B</p>
				{/if}
			</div>
		</div>
		<Button
			class="h-5 w-5 p-0.5"
			variant="ghost"
			on:click={() => {
				dispatch('exitButtonClicked');
			}}
			aria-label="Remove this testcase">
			<X size={16} />
		</Button>
	</div>
	<div
		class="flex h-64 min-h-64 resize-y flex-col space-y-2 overflow-hidden p-2 @4xl:h-32 @4xl:min-h-32 @4xl:flex-row @4xl:space-x-2 @4xl:space-y-0 2xl:h-80 2xl:min-h-80 @4xl:2xl:h-40 @4xl:2xl:min-h-40">
		<div class="flex h-0 w-full flex-grow flex-col space-y-1 @4xl:h-full @4xl:w-0">
			<Label>Input</Label>
			<Textarea
				placeholder="Enter your input here"
				bind:value={input}
				class="textarea-code h-0 flex-grow resize-none rounded-lg" />
		</div>
		<div class="flex h-0 w-full flex-grow flex-col space-y-1 @4xl:h-full @4xl:w-0">
			<Label>Output</Label>
			<ScrollArea
				orientation="both"
				class="h-0 w-full flex-grow rounded-lg border border-border bg-background px-3 py-2">
				{#if outputLines.length === 0 || (outputLines.length === 1 && outputLines[0] === '')}
					<code class="block whitespace-pre-wrap text-nowrap text-sm text-muted-foreground">
						The output will be here when you run the code
					</code>
				{:else}
					{#each outputLines as line}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<code class="block whitespace-pre-wrap text-nowrap text-sm">{@html line}</code>
					{/each}
				{/if}
			</ScrollArea>
		</div>
	</div>
</div>

<style lang="postcss">
	code,
	:global(.textarea-code) {
		font-family: 'Fira Code', monospace;
	}
</style>
