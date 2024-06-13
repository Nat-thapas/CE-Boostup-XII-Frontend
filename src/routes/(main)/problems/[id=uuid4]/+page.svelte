<script lang="ts">
	import { cpp } from '@codemirror/lang-cpp';
	import { githubLight } from '@uiw/codemirror-theme-github';
	import { vscodeDark } from '@uiw/codemirror-theme-vscode';
	import { Mutex } from 'async-mutex';
	import { CirclePlay, Lightbulb, LoaderCircle, Plus, Upload } from 'lucide-svelte';
	import { mode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	import { PUBLIC_API_URL } from '$env/static/public';

	import { compareOutput } from '$lib/compare-output';
	import EditableTestcase from '$lib/components/problem/EditableTestcase.svelte';
	import Testcase from '$lib/components/problem/Testcase.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Rating from '$lib/components/ui/Rating.svelte';
	import * as Resizable from '$lib/components/ui/resizable';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Select from '$lib/components/ui/select';
	import * as Tabs from '$lib/components/ui/tabs';
	import { format } from '$lib/format-number';

	import type { PageData } from './$types';

	const mutex = new Mutex();
	const fadeDuration = 200;
	const flipDuration = 400;
	const languages = [
		'c99',
		'c11',
		'c17',
		'c++11',
		'c++14',
		'c++17',
		'c++20',
		'c++23',
		'gnu99',
		'gnu11',
		'gnu17',
		'gnu++11',
		'gnu++14',
		'gnu++17',
		'gnu++20',
		'gnu++23'
	];

	export let data: PageData;

	let language: string = 'c++17';

	$: selectedLanguage = {
		value: language,
		label: language.toUpperCase()
	};

	let code = data.code;

	let examples: {
		id: string;
		input: string;
		output: string;
		passed: boolean | undefined;
		errCode: string | undefined;
		time: number | undefined;
		memory: number | undefined;
	}[] =
		data.problem.exampleTestcases?.map((testcase) => ({
			id: crypto.randomUUID(),
			input: testcase.input,
			output: testcase.output,
			passed: undefined,
			errCode: undefined,
			time: undefined,
			memory: undefined
		})) ?? [];

	let testcases: {
		id: string;
		input: string;
		output: string;
		time: number | undefined;
		memory: number | undefined;
	}[] = [{ id: crypto.randomUUID(), input: '', output: '', time: undefined, memory: undefined }];

	let waiting = false;

	async function testExamples() {
		const release = await mutex.acquire();
		waiting = true;

		try {
			try {
				const response = await fetch(`${PUBLIC_API_URL}/compile-and-run`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${data.token}`
					},
					body: JSON.stringify({
						language,
						code,
						inputs: examples.map(({ input }) => input),
						allowedHeaders: data.problem.allowedHeaders,
						bannedFunctions: data.problem.bannedFunctions,
						timeLimit: data.problem.timeLimit,
						memoryLimit: data.problem.memoryLimit,
						formattedDiagnostic: true
					})
				});

				const responseData = await response.json();

				if (!response.ok) {
					toast.error('Failed to run the code', {
						description: `Error: ${responseData.message ?? response.statusText}`
					});
					return;
				}

				if (responseData.code) {
					examples = examples.map((testcase) => ({
						...testcase,
						passed: false,
						errCode: responseData.code,
						time: undefined,
						memory: undefined
					}));
				} else {
					examples = examples.map((testcase, i) => ({
						...testcase,
						passed:
							!responseData.outputs[i].code &&
							compareOutput(testcase.output, responseData.outputs[i].runtimeOutput),
						errCode:
							responseData.outputs[i].code ||
							(compareOutput(testcase.output, responseData.outputs[i].runtimeOutput)
								? undefined
								: 'WA'),
						time: responseData.outputs[i].executionTime,
						memory: responseData.outputs[i].executionMemory
					}));
				}

				toast.success('Compiled and ran the code successfully!');
			} catch (err) {
				toast.error('Failed to run the code', {
					description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
				});
				return;
			}
		} finally {
			waiting = false;
			release();
		}
	}

	async function testTestcases() {
		const release = await mutex.acquire();
		waiting = true;

		try {
			try {
				const response = await fetch(`${PUBLIC_API_URL}/compile-and-run`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${data.token}`
					},
					body: JSON.stringify({
						language,
						code,
						inputs: testcases.map(({ input }) => input),
						allowedHeaders: data.problem.allowedHeaders,
						bannedFunctions: data.problem.bannedFunctions,
						timeLimit: data.problem.timeLimit,
						memoryLimit: data.problem.memoryLimit,
						formattedDiagnostic: true
					})
				});

				const responseData = await response.json();

				if (!response.ok) {
					toast.error('Failed to run the code', {
						description: `Error: ${responseData.message ?? response.statusText}`
					});
					return;
				}

				if (responseData.code) {
					testcases = testcases.map((testcase) => ({
						...testcase,
						output: responseData.compilerOutput,
						time: undefined,
						memory: undefined
					}));
				} else {
					testcases = testcases.map((testcase, i) => ({
						...testcase,
						output: responseData.outputs[i].runtimeOutput,
						time: responseData.outputs[i].executionTime,
						memory: responseData.outputs[i].executionMemory
					}));
				}

				toast.success('Compiled and ran the code successfully!');
			} catch (err) {
				toast.error('Failed to run the code', {
					description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
				});
				return;
			}
		} finally {
			waiting = false;
			release();
		}
	}

	onMount(() => {
		const savedLanguage = localStorage.getItem('language');
		if (savedLanguage) {
			language = savedLanguage;
		}
	});

	let hintDialogOpen = false;

	function handleHintButtonClick() {
		if (!data.problem.hint && data.problem.hintCost === 0) {
			toast.error('No hint available');
		}
		hintDialogOpen = true;
	}

	function handleSubmitButtonClick() {
		toast.info('Submit button clicked'); // TODO
	}

	console.log(data.problem.allowedHeaders);
</script>

<svelte:head>
	<title>CE Boostup XII - Problem - {data.problem.title}</title>
</svelte:head>

<Dialog.Root bind:open={hintDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{#if data.problem.hint}
					Hint
				{:else}
					Unlock Hint
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if !data.problem.hint}
					Unlock hint with your score
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		{#if data.problem.hint}
			<p>{data.problem.hint}</p>
		{:else}
			<p>Unlock hint with {data.problem.hintCost} points?</p>
		{/if}
		{#if !data.problem.hint}
			<Dialog.Footer>
				<Button>Unlock</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane defaultSize={50} class="min-w-80">
		<div class="m-2 flex space-x-2">
			<Select.Root
				selected={selectedLanguage}
				onSelectedChange={(v) => {
					if (v) {
						language = v.value;
						localStorage.setItem('language', language);
					}
				}}>
				<Select.Trigger class="w-0 flex-grow">
					<Select.Value placeholder="Language" />
				</Select.Trigger>
				<Select.Content>
					<Select.SelectLabel>Language</Select.SelectLabel>
					{#each languages as language}
						<Select.Item value={language}>{language.toUpperCase()}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button class="flex w-0 flex-grow items-center space-x-2" on:click={handleHintButtonClick}>
				<Lightbulb />
				<p>Hint</p>
			</Button>
			{#if waiting}
				<Button disabled class="flex w-0 flex-grow items-center space-x-2">
					<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					<p>Running...</p>
				</Button>
			{:else}
				<Button
					class="flex w-0 flex-grow items-center space-x-2"
					on:click={handleSubmitButtonClick}>
					<Upload />
					<p>Submit</p>
				</Button>
			{/if}
		</div>
		<CodeMirror
			bind:value={code}
			lang={cpp()}
			theme={$mode === 'light' ? githubLight : vscodeDark}
			tabSize={4}
			placeholder="Enter your code here..."
			styles={{
				'&': {
					width: 'auto',
					height: 'calc(100vh - 128px)',
					margin: '0.5rem',
					padding: '0.5rem',
					borderRadius: '0.5rem',
					fontSize: '0.875rem'
				}
			}}
			on:change={() => {
				try {
					localStorage.setItem('code', code);
				} catch (err) {
					toast.error('Failed to save code to local storage', {
						description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
					});
				}
			}} />
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane defaultSize={50} class="min-w-80 px-2">
		<Tabs.Root>
			<Tabs.List class="mr-4 mt-2 flex w-auto items-center">
				<Tabs.Trigger value="details" class="w-0 flex-grow">Details</Tabs.Trigger>
				<Tabs.Trigger value="examples" class="w-0 flex-grow">Example Testcases</Tabs.Trigger>
				<Tabs.Trigger value="testcases" class="w-0 flex-grow">Custom Testcases</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="details">
				<div style="height: calc(100vh - 128px);">
					<ScrollArea class="h-full pl-2 pr-4">
						<h1 class="mb-2 text-2xl font-semibold">{data.problem.number}. {data.problem.title}</h1>
						<div class="mb-4 flex flex-wrap gap-2 py-1">
							<div class="mr-2 flex h-8 w-fit items-center space-x-4 rounded-lg bg-muted px-4 py-1">
								<Rating value={data.problem.difficulty ?? 0} size={20} />
								<p class="pt-0.5">{data.problem.score ?? 0} คะแนน</p>
							</div>
							{#if data.problem.tags}
								{#each data.problem.tags as tag}
									<div class="flex h-8 items-center rounded-lg bg-muted px-2 text-sm">
										<p>{tag.name}</p>
									</div>
								{/each}
							{/if}
						</div>
						{#if data.problem.description}
							<div class="mb-4 ml-2">
								<p>{data.problem.description}</p>
							</div>
						{/if}
						{#if data.problem.input}
							<div class="mb-4 rounded-lg p-2">
								<p class="font-medium">Input</p>
								<p class="ml-2">{data.problem.input}</p>
							</div>
						{/if}
						{#if data.problem.output}
							<div class="mb-4 rounded-lg p-2">
								<p class="font-medium">Output</p>
								<p class="ml-2">{data.problem.output}</p>
							</div>
						{/if}
						{#if data.problem.allowedHeaders && data.problem.allowedHeaders.length > 0}
							<div class="mb-4 rounded-lg p-2">
								<p class="font-medium">Headers ที่ใช้ได้</p>
								<div class="ml-2 mt-2 flex flex-wrap gap-2">
									{#each data.problem.allowedHeaders as header}
										<div class="flex h-8 items-center rounded-lg bg-muted px-2 text-sm">
											<p>{header}</p>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if data.problem.bannedFunctions && data.problem.bannedFunctions.length > 0}
							<div class="mb-4 rounded-lg p-2">
								<p class="font-medium">Functions ที่ห้ามใช้</p>
								<div class="ml-2 mt-2 flex flex-wrap gap-2">
									{#each data.problem.bannedFunctions as f}
										<div class="flex h-8 items-center rounded-lg bg-muted px-2 text-sm">
											<p>{f}</p>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						<div class="mb-3 rounded-lg p-2">
							<p class="mb-2 font-medium">Limits</p>
							<p class="mb-1 ml-2 text-sm">Time limit: {format(data.problem.timeLimit ?? 0)}s</p>
							<p class="mb-1 ml-2 text-sm">
								Memory limit: {format(data.problem.memoryLimit ?? 0)}B
							</p>
							{#if data.problem.allowedHeaders && data.problem.allowedHeaders.length === 0}
								<p class="mb-1 ml-2 text-sm">No headers allowed</p>
							{/if}
						</div>
						{#if data.problem.attachments && data.problem.attachments.length > 0}
							<div class="mb-4 rounded-lg p-2">
								<p class="mb-2 font-medium">Attachments</p>
								<div class="ml-2 mt-2 flex flex-wrap gap-2">
									{#each data.problem.attachments as attachment}
										<a
											href={`${PUBLIC_API_URL}${attachment.url}`}
											target="_blank"
											class="flex h-8 items-center rounded-lg bg-muted px-4 text-sm hover:underline">
											<p>{attachment.name}</p>
										</a>
									{/each}
								</div>
							</div>
						{/if}
					</ScrollArea>
				</div>
			</Tabs.Content>
			<Tabs.Content value="examples">
				<div class="space-y-2">
					<div class="mr-4 flex space-x-2">
						{#if waiting}
							<Button disabled class="flex w-0 flex-grow items-center space-x-2">
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
								<p>Running...</p>
							</Button>
						{:else}
							<Button class="flex w-0 flex-grow items-center space-x-2" on:click={testExamples}>
								<CirclePlay />
								<p>Test</p>
							</Button>
						{/if}
					</div>
					<div style="height: calc(100vh - 180px);">
						<ScrollArea class="h-full pr-4">
							<div class="space-y-2">
								{#each examples as { id, input, output, passed, errCode, time, memory }, i (id)}
									<div
										class="rounded-lg bg-muted p-2"
										in:fade={{ duration: fadeDuration }}
										out:fade={{ duration: fadeDuration }}
										animate:flip={{ duration: flipDuration }}>
										<EditableTestcase
											number={i + 1}
											bind:input
											bind:output
											error={{ input: 'fix this' }}
											{passed}
											{errCode}
											{time}
											{memory}
											inputPlaceholder="No input"
											outputPlaceholder="No output"
											on:exitButtonClicked={() => {
												examples = examples.filter((testcase) => testcase.id !== id);
											}}
											readonly />
									</div>
								{/each}
							</div>
						</ScrollArea>
					</div>
				</div>
			</Tabs.Content>
			<Tabs.Content value="testcases">
				<div class="space-y-2">
					<div class="mr-4 flex space-x-2">
						<Button
							disabled={testcases.length >= 16}
							on:click={() => {
								testcases = [
									...testcases,
									{
										id: crypto.randomUUID(),
										input: '',
										output: '',
										time: undefined,
										memory: undefined
									}
								];
							}}
							class="mt-2 flex w-0 flex-grow items-center space-x-2">
							<Plus />
							<p>Add Testcase</p>
						</Button>
						{#if waiting}
							<Button disabled class="mt-2 flex w-0 flex-grow items-center space-x-2">
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
								<p>Running...</p>
							</Button>
						{:else}
							<Button
								class="mt-2 flex w-0 flex-grow items-center space-x-2"
								on:click={testTestcases}>
								<CirclePlay />
								<p>Run</p>
							</Button>
						{/if}
					</div>
					<div style="height: calc(100vh - 128px);">
						<ScrollArea class="h-full pr-4">
							<div class="space-y-2">
								{#each testcases as { id, input, output, time, memory }, i (id)}
									<div
										class="rounded-lg bg-muted p-2"
										in:fade={{ duration: fadeDuration }}
										out:fade={{ duration: fadeDuration }}
										animate:flip={{ duration: flipDuration }}>
										<Testcase
											number={i + 1}
											bind:input
											{output}
											{time}
											{memory}
											on:exitButtonClicked={() => {
												testcases = testcases.filter((testcase) => testcase.id !== id);
											}} />
									</div>
								{/each}
							</div>
						</ScrollArea>
					</div>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</Resizable.Pane>
</Resizable.PaneGroup>

<style lang="postcss">
	:global(.cm-line) {
		font-family: 'Fira Code', monospace;
		@apply text-sm xl:text-base;
	}
</style>
