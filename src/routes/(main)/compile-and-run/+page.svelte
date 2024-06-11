<script lang="ts">
	import { cpp } from '@codemirror/lang-cpp';
	import { githubLight } from '@uiw/codemirror-theme-github';
	import { vscodeDark } from '@uiw/codemirror-theme-vscode';
	import { Mutex } from 'async-mutex';
	import { CirclePlay, LoaderCircle, Plus } from 'lucide-svelte';
	import { mode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	import { PUBLIC_API_URL } from '$env/static/public';

	import Testcase from '$lib/components/problem/Testcase.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Resizable from '$lib/components/ui/resizable';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Select from '$lib/components/ui/select';

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
	const optimizationLevels = ['O0', 'Og', 'O1', 'O2', 'O3', 'Os', 'Ofast'];
	const warningLevels = ['default', 'all', 'extra', 'pedantic'];

	export let data: PageData;

	let code =
		'#include <stdio.h>\n\nint main() {\n    printf("Hello world!\\n");\n    return 0;\n}\n';

	let testcases: {
		id: string;
		input: string;
		output: string;
		time: number | undefined;
		memory: number | undefined;
	}[] = [{ id: crypto.randomUUID(), input: '', output: '', time: undefined, memory: undefined }];

	let language: string = 'c++17';

	$: selectedLanguage = {
		value: language,
		label: language.toUpperCase()
	};

	let optimizationLevel = 'O1';

	$: selectedOptimizationLevel = {
		value: optimizationLevel,
		label: optimizationLevel
	};

	let warningLevel = 'extra';

	$: selectedWarningLevel = {
		value: warningLevel,
		label: warningLevel.charAt(0).toUpperCase() + warningLevel.slice(1)
	};

	onMount(() => {
		const savedCode = localStorage.getItem('code');
		if (savedCode) {
			code = savedCode;
		}
		const savedLanguage = localStorage.getItem('language');
		if (savedLanguage) {
			language = savedLanguage;
		}
		const savedOptimizationLevel = localStorage.getItem('optimizationLevel');
		if (savedOptimizationLevel) {
			optimizationLevel = savedOptimizationLevel;
		}
		const savedTestcases = localStorage.getItem('testcases');
		if (savedTestcases) {
			testcases = JSON.parse(savedTestcases);
		}
	});

	let waiting = false;

	async function run() {
		const release = await mutex.acquire();
		waiting = true;

		try {
			try {
				localStorage.setItem('testcases', JSON.stringify(testcases));
			} catch (err) {
				toast.error('Failed to save testcases to local storage', {
					description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
				});
			}

			try {
				const response = await fetch(`${PUBLIC_API_URL}/compile-and-run`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${data.token}`
					},
					body: JSON.stringify({
						language,
						optimizationLevel,
						warningLevel,
						code,
						inputs: testcases.map(({ input }) => input),
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

				try {
					localStorage.setItem('testcases', JSON.stringify(testcases));
				} catch (err) {
					toast.error('Failed to save testcases to local storage', {
						description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
					});
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
</script>

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
				}}
			>
				<Select.Trigger class="w-32 flex-grow">
					<Select.Value placeholder="Language" />
				</Select.Trigger>
				<Select.Content>
					<Select.SelectLabel>Language</Select.SelectLabel>
					{#each languages as language}
						<Select.Item value={language}>{language.toUpperCase()}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root
				selected={selectedOptimizationLevel}
				onSelectedChange={(v) => {
					if (v) {
						optimizationLevel = v.value;
						localStorage.setItem('optimizationLevel', optimizationLevel);
					}
				}}
			>
				<Select.Trigger class="w-28 flex-grow">
					<Select.Value placeholder="Optimization" />
				</Select.Trigger>
				<Select.Content>
					<Select.SelectLabel>Optimization</Select.SelectLabel>
					{#each optimizationLevels as optimizationLevel}
						<Select.Item value={optimizationLevel}>{optimizationLevel}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root
				selected={selectedWarningLevel}
				onSelectedChange={(v) => {
					if (v) {
						warningLevel = v.value;
						localStorage.setItem('warningLevel', warningLevel);
					}
				}}
			>
				<Select.Trigger class="w-32 flex-grow">
					<Select.Value placeholder="Warning" />
				</Select.Trigger>
				<Select.Content>
					<Select.SelectLabel>Warning</Select.SelectLabel>
					{#each warningLevels as warningLevel}
						<Select.Item value={warningLevel}
							>{warningLevel.charAt(0).toUpperCase() + warningLevel.slice(1)}</Select.Item
						>
					{/each}
				</Select.Content>
			</Select.Root>
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
			}}
		/>
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane defaultSize={50} class="min-w-80 px-2">
		<div class="space-y-2">
			<div class="mr-4 flex space-x-2">
				<Button
					disabled={testcases.length >= 16}
					on:click={() => {
						testcases = [
							...testcases,
							{ id: crypto.randomUUID(), input: '', output: '', time: undefined, memory: undefined }
						];
					}}
					class="mt-2 flex w-0 flex-grow items-center space-x-2"
					><Plus />
					<p>Add Testcase</p></Button
				>
				{#if waiting}
					<Button disabled class="mt-2 flex w-0 flex-grow items-center space-x-2">
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						<p>Running...</p>
					</Button>
				{:else}
					<Button class="mt-2 flex w-0 flex-grow items-center space-x-2" on:click={run}
						><CirclePlay />
						<p>Run</p></Button
					>
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
								animate:flip={{ duration: flipDuration }}
							>
								<Testcase
									number={i + 1}
									bind:input
									bind:output
									{time}
									{memory}
									on:exitButtonClicked={() => {
										testcases = testcases.filter((testcase) => testcase.id !== id);
									}}
								/>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</div>
		</div>
	</Resizable.Pane>
</Resizable.PaneGroup>

<style lang="postcss">
	:global(.cm-line) {
		font-family: 'Fira Code', monospace;
		@apply text-sm lg:text-base;
	}
</style>
