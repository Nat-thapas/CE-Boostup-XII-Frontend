<script lang="ts">
	import { Circle, CircleCheck, CircleX, X } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { format } from '$lib/format-number';
	import { cn } from '$lib/utils';

	const dispatch = createEventDispatcher();

	let className: string = '';
	export { className as class };

	export let number: number;
	export let input: string;
	export let output: string;
	export let passed: boolean | undefined = undefined;
	export let errCode: string | undefined = undefined;
	export let error: { input?: string | string[]; output?: string | string[] } | undefined =
		undefined;
	export let time: number | undefined = undefined;
	export let memory: number | undefined = undefined;
	export let disabled: boolean = false;
</script>

<div class={cn('@container', className)}>
	<div class="ml-2 flex items-center justify-between">
		<div class="flex items-center">
			<p class="text-base font-medium @sm:mr-2">Testcase #{number}</p>
			<div class="ml-2 flex flex-col @xs:ml-4 @md:flex-row @md:space-x-2">
				{#if passed === true}
					<CircleCheck size={20} color="#22c55e" />
				{:else if passed === false}
					<CircleX size={20} color="#dc2626" />
				{:else}
					<Circle size={20} color="#737373" />
				{/if}
				{#if errCode !== undefined}
					<p class="text-sm font-medium text-destructive">{errCode}</p>
				{/if}
			</div>
			<div class="ml-2 flex flex-col @xs:ml-4 @sm:ml-5 @md:flex-row @md:space-x-4">
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
			{disabled}
		>
			<X size={16} />
		</Button>
	</div>
	<div
		class="flex h-64 min-h-64 resize-y flex-col space-y-2 overflow-hidden p-2 @4xl:h-32 @4xl:min-h-32 @4xl:flex-row @4xl:space-x-2 @4xl:space-y-0 2xl:h-80 2xl:min-h-80 @4xl:2xl:h-40 @4xl:2xl:min-h-40"
	>
		<div class="flex h-0 w-full flex-grow flex-col space-y-1 @4xl:h-full @4xl:w-0">
			<Label>Input</Label>
			<Textarea
				placeholder="Enter your input here"
				bind:value={input}
				class="textarea-code h-0 min-h-0 flex-grow resize-none rounded-lg"
				{disabled}
			/>
			<div>
				{#if error !== undefined && error.input !== undefined}
					{#if error.input instanceof Array}
						{#each error.input as err}
							<p class="text-sm font-medium text-destructive">{err}</p>
						{/each}
					{:else}
						<p class="text-sm font-medium text-destructive">{error.input}</p>
					{/if}
				{/if}
			</div>
		</div>
		<div class="flex h-0 w-full flex-grow flex-col space-y-1 @4xl:h-full @4xl:w-0">
			<Label>Output</Label>
			<Textarea
				placeholder="Enter the expected output here"
				bind:value={output}
				class="textarea-code h-0 flex-grow resize-none rounded-lg"
				{disabled}
			/>
			<div>
				{#if error !== undefined && error.output !== undefined}
					{#if error.output instanceof Array}
						{#each error.output as err}
							<p class="text-sm font-medium text-destructive">{err}</p>
						{/each}
					{:else}
						<p class="text-sm font-medium text-destructive">{error.output}</p>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(.textarea-code) {
		font-family: 'Fira Code', monospace;
	}
</style>
