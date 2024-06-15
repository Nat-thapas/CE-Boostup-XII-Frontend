<script lang="ts">
	import { cpp } from '@codemirror/lang-cpp';
	import { githubLight } from '@uiw/codemirror-theme-github';
	import { vscodeDark } from '@uiw/codemirror-theme-vscode';
	import { Mutex } from 'async-mutex';
	import {
		Archive,
		Ban,
		Check,
		CirclePlay,
		LoaderCircle,
		Plus,
		Rocket,
		Save,
		ScanSearch,
		Star,
		Trash2,
		Undo2,
		X
	} from 'lucide-svelte';
	import { mode } from 'mode-watcher';
	import CodeMirror from 'svelte-codemirror-editor';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { filesProxy, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { goto, invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';
	import { PUBLIC_API_URL } from '$env/static/public';

	import { compareOutput } from '$lib/compare-output';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import EditableTestcase from '$lib/components/problem/EditableTestcase.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import FileInput from '$lib/components/ui/FileInput.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Resizable from '$lib/components/ui/resizable';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Select from '$lib/components/ui/select';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Textarea } from '$lib/components/ui/textarea';
	import { OptimizationLevel } from '$lib/enums/optimization-level.enum';
	import { ProgrammingLanguage } from '$lib/enums/programming-language.enum';
	import { PublicationStatus } from '$lib/enums/publication-status.enum';
	import { Role } from '$lib/enums/role.enum';
	import type { ProblemTag } from '$lib/intefaces/problem-tag.interface';
	import { isAllNestedUndefined } from '$lib/is-all-nested-undefined';
	import { isSomeRolesIn } from '$lib/roles';
	import { formSchema } from '$lib/schemas/edit-problem.schema';

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

	export let data: PageData;

	const form = superForm(data.editProblemForm, {
		validators: zodClient(formSchema),

		resetForm: false,

		applyAction: true,

		dataType: 'json',

		onUpdated({ form }) {
			if (form.message) {
				switch (form.message.type) {
					case 'success':
						toast.success(form.message.text);
						break;
					case 'warning':
						toast.warning(form.message.text);
						break;
					case 'error':
						toast.error(form.message.text);
						break;
				}
			}
		}
	});

	const { form: formData, message, enhance, errors } = form;

	let solution =
		data.problem.solution ??
		'#include <stdio.h>\n\nint main() {\n    printf("Hello world!\\n");\n    return 0;\n}\n';

	let starter = data.problem.starterCode ?? '';

	let examples: {
		id: string;
		input: string;
		output: string;
		passed: boolean | undefined;
		errCode: string | undefined;
		time: number | undefined;
		memory: number | undefined;
	}[] = data.problem.exampleTestcases
		? data.problem.exampleTestcases.map((testcase) => ({
				id: crypto.randomUUID(),
				input: testcase.input,
				output: testcase.output,
				passed: undefined,
				errCode: undefined,
				time: undefined,
				memory: undefined
			}))
		: [];

	let testcases: {
		id: string;
		input: string;
		output: string;
		passed: boolean | undefined;
		errCode: string | undefined;
		time: number | undefined;
		memory: number | undefined;
	}[] = data.problem.testcases
		? data.problem.testcases.map((testcase) => ({
				id: crypto.randomUUID(),
				input: testcase.input,
				output: testcase.output,
				passed: undefined,
				errCode: undefined,
				time: undefined,
				memory: undefined
			}))
		: [];

	let language: string = data.problem.solutionLanguage ?? 'c++17';

	$: selectedLanguage = {
		value: language,
		label: language.toUpperCase()
	};

	let optimizationLevel = data.problem.optimizationLevel ?? 'O1';

	$: selectedOptimizationLevel = {
		value: optimizationLevel,
		label: optimizationLevel
	};

	let waiting = false;

	async function testExamples(): Promise<void> {
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
						optimizationLevel,
						code: solution,
						inputs: examples.map(({ input }) => input),
						allowedHeaders: $formData.allowAllHeaders ? null : $formData.allowedHeaders,
						bannedFunctions: $formData.bannedFunctions,
						timeLimit: $formData.timeLimit ? +$formData.timeLimit : undefined,
						memoryLimit: $formData.memoryLimit ? +$formData.memoryLimit : undefined,
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

	async function testTestcases(): Promise<void> {
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
						optimizationLevel,
						code: solution,
						inputs: testcases.map(({ input }) => input),
						allowedHeaders: $formData.allowAllHeaders ? null : $formData.allowedHeaders,
						bannedFunctions: $formData.bannedFunctions,
						timeLimit: $formData.timeLimit ? +$formData.timeLimit : undefined,
						memoryLimit: $formData.memoryLimit ? +$formData.memoryLimit : undefined,
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
						passed: false,
						errCode: responseData.code,
						time: undefined,
						memory: undefined
					}));
				} else {
					testcases = testcases.map((testcase, i) => ({
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

	let newTagName: string = '';

	async function postNewTag(name: string): Promise<ProblemTag> {
		const response = await fetch(`${PUBLIC_API_URL}/problem-tags`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${data.token}`
			},
			body: JSON.stringify({ name })
		});

		const responseData = await response.json();

		if (!response.ok) {
			throw new Error(
				responseData.message instanceof Array
					? responseData.message.join(', ')
					: responseData.message
			);
		}

		return responseData;
	}

	function addNewTag(): void {
		if (!newTagName) {
			toast.error('Tag name cannot be empty');
			return;
		}

		if (data.problemTags.data.some((tag) => tag.name === newTagName)) {
			toast.error('Tag already exists');
			return;
		}

		const responsePromise = postNewTag(newTagName);

		toast.promise(responsePromise, {
			loading: 'Adding new tag...',
			success: (responseData) => {
				data.problemTags.data = [...data.problemTags.data, responseData];
				newTagName = '';
				return 'New tag added successfully!';
			},
			error: (err) => {
				console.error(err);
				return `Failed to add new tag: ${err instanceof Error ? err.message : 'Unknown error'}`;
			}
		});
	}

	let newBannedFunction: string = '';

	function addNewBannedFunction(): void {
		if (!newBannedFunction) {
			toast.error('Function name cannot be empty');
			return;
		}

		if ($formData.bannedFunctions?.includes(newBannedFunction)) {
			toast.error('Function already exists');
			return;
		}

		$formData.bannedFunctions = $formData.bannedFunctions
			? [...$formData.bannedFunctions, newBannedFunction]
			: [newBannedFunction];

		newBannedFunction = '';
	}

	let newAllowedHeader: string = '';

	function addNewAllowedHeader(): void {
		if (!newAllowedHeader) {
			toast.error('Header name cannot be empty');
			return;
		}

		if ($formData.allowedHeaders?.includes(newAllowedHeader)) {
			toast.error('Header already exists');
			return;
		}

		$formData.allowedHeaders = $formData.allowedHeaders
			? [...$formData.allowedHeaders, newAllowedHeader]
			: [newAllowedHeader];

		newAllowedHeader = '';
	}

	async function sendDeleteRequest(): Promise<void> {
		const response = await fetch(`${PUBLIC_API_URL}/problems/${data.problem.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${data.token}`
			}
		});

		if (response.ok) {
			return;
		} else {
			const data = await response.json();
			throw new Error(data.message instanceof Array ? data.message.join(', ') : data.message);
		}
	}

	function deleteProblem(): void {
		const requestPromise = sendDeleteRequest();
		toast.promise(requestPromise, {
			loading: 'Deleting problem...',
			success: () => {
				goto(`${base}/problems`);
				return 'Problem deleted successfully!';
			},
			error: (err) => {
				console.error(err);
				invalidateAll();
				return `Failed to delete problem: ${err instanceof Error ? err.message : 'Unknown error'}`;
			}
		});
	}

	const attachments = filesProxy(form, 'attachments');

	function submitProblemForReview(): void {
		$formData.publicationStatus = PublicationStatus.AwaitingApproval;
		form.submit();
	}

	function revertProblemToDraft(): void {
		$formData.publicationStatus = PublicationStatus.Draft;
		form.submit();
	}

	function approveProblem(): void {
		$formData.publicationStatus = PublicationStatus.Approved;
		form.submit();
	}

	function rejectProblem(): void {
		$formData.publicationStatus = PublicationStatus.Rejected;
		form.submit();
	}

	function publishProblem(): void {
		$formData.publicationStatus = PublicationStatus.Published;
		form.submit();
	}

	function archiveProblem(): void {
		$formData.publicationStatus = PublicationStatus.Archived;
		form.submit();
	}

	$: $formData.solution = solution;
	$: $formData.starterCode = starter;
	$: $formData.solutionLanguage = language as ProgrammingLanguage;
	$: $formData.optimizationLevel = optimizationLevel as OptimizationLevel;

	$: $formData.exampleTestcases = examples.map(({ input, output }) => ({ input, output }));
	$: $formData.testcases = testcases.map(({ input, output }) => ({ input, output }));

	$formData.title = data.problem.title ?? '';
	$formData.description = data.problem.description;
	$formData.input = data.problem.input;
	$formData.output = data.problem.output;
	$formData.hint = data.problem.hint;
	$formData.hintCost = data.problem.hintCost;
	$formData.difficulty = data.problem.difficulty ?? 0;
	$formData.score = data.problem.score ?? 0;
	$formData.tags = data.problem.tags ? data.problem.tags.map((tag) => tag.id) : [];
	$formData.allowAllHeaders = data.problem.allowedHeaders === null;
	$formData.allowedHeaders = data.problem.allowedHeaders ?? [];
	$formData.bannedFunctions = data.problem.bannedFunctions ?? [];
	$formData.timeLimit = data.problem.timeLimit;
	$formData.memoryLimit = data.problem.memoryLimit;
	$formData.credits = data.problem.credits;
	$formData.oldAttachments = data.problem.attachments ?? [];
	$formData.publicationStatus = data.problem.publicationStatus ?? PublicationStatus.Archived;
	$formData.reviewComment = data.problem.reviewComment ?? '';

	let shownCodeEditExperimentationOnly = false;

	$: console.log('formdatachange'), $formData;
</script>

<svelte:head>
	<title>CE Boostup XII - Problem - {data.problem.title}</title>
</svelte:head>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane defaultSize={50} class="min-w-80">
		<div class="m-2 flex space-x-2">
			<Select.Root
				selected={selectedLanguage}
				onSelectedChange={(v) => {
					if (v) {
						language = v.value;
					}
				}}
				disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
					(data.user.id !== data.problem.owner?.id &&
						!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}>
				<Select.Trigger class="w-32 flex-grow" aria-label="language">
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
					}
				}}
				disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
					(data.user.id !== data.problem.owner?.id &&
						!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}>
				<Select.Trigger class="w-28 flex-grow" aria-label="optimization">
					<Select.Value placeholder="Optimization" />
				</Select.Trigger>
				<Select.Content>
					<Select.SelectLabel>Optimization</Select.SelectLabel>
					{#each optimizationLevels as optimizationLevel}
						<Select.Item value={optimizationLevel}>{optimizationLevel}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<Tabs.Root>
			<Tabs.List class="mx-2 flex w-auto items-center">
				<Tabs.Trigger value="solution" class="w-0 flex-grow">Solution</Tabs.Trigger>
				<Tabs.Trigger value="starter" class="w-0 flex-grow">Starter Code</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="solution">
				<CodeMirror
					bind:value={solution}
					lang={cpp()}
					theme={$mode === 'light' ? githubLight : vscodeDark}
					tabSize={4}
					placeholder="Enter your solution here..."
					styles={{
						'&': {
							width: 'auto',
							height: 'calc(100vh - 180px)',
							margin: '0.5rem',
							padding: '0.5rem',
							borderRadius: '0.5rem',
							fontSize: '0.875rem'
						}
					}}
					on:change={() => {
						if (shownCodeEditExperimentationOnly) return;
						shownCodeEditExperimentationOnly = true;
						if (
							data.problem.publicationStatus !== PublicationStatus.Draft ||
							data.user.id !== data.problem.owner?.id
						) {
							toast.warning('Your changes will not be saved', {
								description: 'You can edit the code for experimentation purposes only'
							});
						}
					}} />
			</Tabs.Content>
			<Tabs.Content value="starter">
				<CodeMirror
					bind:value={starter}
					lang={cpp()}
					theme={$mode === 'light' ? githubLight : vscodeDark}
					tabSize={4}
					placeholder="Enter your starter/skeleton code here (optional)"
					styles={{
						'&': {
							width: 'auto',
							height: 'calc(100vh - 180px)',
							margin: '0.5rem',
							padding: '0.5rem',
							borderRadius: '0.5rem',
							fontSize: '0.875rem'
						}
					}}
					on:change={() => {
						if (shownCodeEditExperimentationOnly) return;
						shownCodeEditExperimentationOnly = true;
						if (
							data.problem.publicationStatus !== PublicationStatus.Draft ||
							data.user.id !== data.problem.owner?.id
						) {
							toast.warning('Your changes will not be saved', {
								description: 'You can edit the code for experimentation purposes only'
							});
						}
					}} />
			</Tabs.Content>
		</Tabs.Root>
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane defaultSize={50} class="min-w-80 px-2">
		<Tabs.Root>
			<Tabs.List class="mr-4 mt-2 flex w-auto items-center">
				<Tabs.Trigger value="details" class="w-0 flex-grow">Details</Tabs.Trigger>
				<Tabs.Trigger value="examples" class="w-0 flex-grow">Example Testcases</Tabs.Trigger>
				<Tabs.Trigger value="testcases" class="w-0 flex-grow">Testcases (hidden)</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="details">
				<div style="height: calc(100vh - 128px);">
					<ScrollArea class="h-full pr-4">
						<form
							method="POST"
							action="?/edit_problem&id={data.problem.id}"
							enctype="multipart/form-data"
							use:enhance
							class="space-y-4 px-2">
							<Form.Field {form} name="title">
								<Form.Control let:attrs>
									<Form.Label>ชื่อโจทย์</Form.Label>
									<Input
										{...attrs}
										bind:value={$formData.title}
										readonly={data.user.id !== data.problem.owner?.id &&
											!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
										disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
											(data.user.id === data.problem.owner?.id ||
												isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="description">
								<Form.Control let:attrs>
									<Form.Label>คำอธิบายโจทย์</Form.Label>
									<Form.Description>
										ถึงลักษณะของโจทย์ สิ่งที่ต้องการให้ทำ อาจมีการยกตัวอย่าง
										และการกล่าวถึงข้อจำกัดต่าง ๆ
									</Form.Description>
									<Textarea
										{...attrs}
										bind:value={$formData.description}
										readonly={data.user.id !== data.problem.owner?.id &&
											!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
										disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
											(data.user.id === data.problem.owner?.id ||
												isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
										class="resize-none" />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="input">
								<Form.Control let:attrs>
									<Form.Label>คำอธิบาย Input</Form.Label>
									<Form.Description>
										ลักษณะของ Input เช่น จำนวนเต็ม 2 จำนวน คั่นด้วยลูกน้ำ
									</Form.Description>
									<Textarea
										{...attrs}
										bind:value={$formData.input}
										readonly={data.user.id !== data.problem.owner?.id &&
											!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
										disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
											(data.user.id === data.problem.owner?.id ||
												isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
										class="resize-none" />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="output">
								<Form.Control let:attrs>
									<Form.Label>คำอธิบาย Output</Form.Label>
									<Form.Description>
										ลักษณะของ Output เช่น ขอบรูปสี่เหลี่ยมที่สร้างด้วย *
										ความกว้างเท่ากับจำนวนเต็มแรก ความสูงเท่ากับจำนวนเต็มหลัง
									</Form.Description>
									<Textarea
										{...attrs}
										bind:value={$formData.output}
										readonly={data.user.id !== data.problem.owner?.id &&
											!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
										disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
											(data.user.id === data.problem.owner?.id ||
												isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
										class="resize-none" />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="hint">
								<Form.Control let:attrs>
									<Form.Label>คำใบ้ (ถ้าไม่มีไม่ต้องใส่)</Form.Label>
									<Textarea
										{...attrs}
										bind:value={$formData.hint}
										readonly={data.user.id !== data.problem.owner?.id &&
											!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
										disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
											(data.user.id === data.problem.owner?.id ||
												isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
										class="resize-none" />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="hintCost">
								<Form.Control let:attrs>
									<Form.Label>ราคาคำใบ้</Form.Label>
									<Form.Description>คะแนนที่จะต้องใช้ในการเปิดคำใบ้</Form.Description>
									<Input
										{...attrs}
										bind:value={$formData.hintCost}
										inputmode="numeric"
										readonly={data.user.id !== data.problem.owner?.id &&
											!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
										disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
											(data.user.id === data.problem.owner?.id ||
												isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<div class="flex space-x-4">
								<Form.Field {form} name="difficulty" class="flex-grow">
									<Form.Control let:attrs>
										<Form.Label>ความยาก</Form.Label><Form.Description>
											ดูวิธีการเลือกได้ที่ <a
												href="https://docs.google.com/document/d/1nMUpoFvNJbHcjCra8hoOfUJo_EKPNhtQP6z7NMRWI-k"
												class="underline">
												Google Docs
											</a>
										</Form.Description>
										<div
											class="flex h-10 w-full items-center justify-start space-x-2 rounded-md border border-border px-2 py-4 hover:bg-muted"
											class:cursor-no={data.problem.publicationStatus !== PublicationStatus.Draft}>
											<p class="text-nowrap text-sm font-normal">ความยาก</p>
											<div class="flex items-center">
												<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
												{#each Array(5) as _, i}
													<button
														on:click|preventDefault|stopPropagation={() => {
															$formData.difficulty = i + 1;
														}}
														disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
															(data.user.id !== data.problem.owner?.id &&
																!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
														class:cursor-no={data.problem.publicationStatus !==
															PublicationStatus.Draft}
														aria-label={`Difficulty: ${i + 1}`}>
														<Star
															color="#E2AD39"
															size={24}
															fill="#E2AD39"
															fill-opacity={i < ($formData.difficulty ?? 0) ? 1 : 0} />
													</button>
												{/each}
											</div>
										</div>
										<input hidden bind:value={$formData.difficulty} name={attrs.name} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<Form.Field {form} name="score" class="flex-grow">
									<Form.Control let:attrs>
										<Form.Label>คะแนน</Form.Label>
										<Form.Description>≈ ความยาก X 100</Form.Description>
										<Input
											{...attrs}
											bind:value={$formData.score}
											readonly={data.user.id !== data.problem.owner?.id &&
												!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
												(data.user.id === data.problem.owner?.id ||
													isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
											inputmode="numeric" />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</div>
							<Form.Fieldset {form} name="tags" class="space-y-0">
								<div class="mb-4">
									<Form.Legend class="mb-3">เนื้อหา</Form.Legend>
									<Form.Description>
										เลือกเนื้อหาที่เกี่ยวข้องกับโจทย์นี้ สามารถเลือกได้มากกว่า 1 หรือไม่เลือกเลย
										หากไม่มีเนื้อหาที่ต้องการสามารถสร้างเนื้อหาใหม่ได้
									</Form.Description>
								</div>
								<div class="space-y-2">
									{#each data.problemTags.data as tag}
										{@const checked = $formData.tags && $formData.tags.includes(tag.id)}
										<div class="flex flex-row items-center space-x-3">
											<Form.Control let:attrs>
												<Checkbox
													{...attrs}
													{checked}
													onCheckedChange={(v) => {
														if (v) {
															$formData.tags = $formData.tags
																? [...$formData.tags, tag.id]
																: [tag.id];
														} else {
															$formData.tags = $formData.tags
																? $formData.tags.filter((i) => i !== tag.id)
																: undefined;
														}
													}}
													disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
														(data.user.id !== data.problem.owner?.id &&
															!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
													aria-label={`Tag: ${tag.name}`} />
												<Form.Label class="font-normal">
													{tag.name}
												</Form.Label>
												<input hidden type="checkbox" name={attrs.name} value={tag.id} {checked} />
											</Form.Control>
										</div>
									{/each}
									<div class="flex items-center pt-2">
										<input
											bind:value={newTagName}
											on:keydown|stopPropagation={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addNewTag();
												}
											}}
											readonly={data.user.id !== data.problem.owner?.id &&
												!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
												(data.user.id === data.problem.owner?.id ||
													isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
											placeholder="เพิ่มเนื้อหา"
											class="flex h-9 w-full rounded-md rounded-r-none border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
										<Button
											size="sm"
											on:click={addNewTag}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
												(data.user.id !== data.problem.owner?.id &&
													!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
											class="rounded-l-none">
											<Plus />
										</Button>
									</div>
									<Form.FieldErrors />
								</div>
							</Form.Fieldset>
							<Form.Fieldset {form} name="allowedHeaders" class="space-y-0">
								<div class="mb-2">
									<Form.Legend class="mb-3">Header ที่อนุญาตให้ใช้ได้</Form.Legend>
									<Form.Description>
										ชื่อ Header File ที่อนุญาตให้ใช้ในโค้ด ไม่รองรับ Header File ที่มี / ในชื่อ
									</Form.Description>
								</div>
								<div class="space-y-2">
									<div class="flex flex-wrap gap-2">
										{#if !$formData.allowAllHeaders}
											{#each $formData.allowedHeaders ?? [] as allowedHeader}
												<div
													class="flex items-center space-x-1 rounded-lg bg-muted hover:bg-neutral-200 dark:hover:bg-neutral-700">
													<Form.Control let:attrs>
														<Form.Label class="my-2 ml-2 font-normal">
															{allowedHeader}
														</Form.Label>
														<button
															on:click|preventDefault|stopPropagation={() => {
																$formData.allowedHeaders = $formData.allowedHeaders
																	? $formData.allowedHeaders.filter((h) => h !== allowedHeader)
																	: [];
															}}
															disabled={data.problem.publicationStatus !==
																PublicationStatus.Draft ||
																(data.user.id !== data.problem.owner?.id &&
																	!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}>
															<X size={28} class="p-2" />
														</button>
														<input
															hidden
															type="checkbox"
															name={attrs.name}
															value={allowedHeader}
															checked={true} />
													</Form.Control>
												</div>
											{/each}
										{/if}
									</div>
									<div class="flex items-center pt-2">
										<input
											bind:value={newAllowedHeader}
											on:keydown|stopPropagation={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addNewAllowedHeader();
												}
											}}
											readonly={data.user.id !== data.problem.owner?.id &&
												!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
												(data.user.id === data.problem.owner?.id ||
													isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
											placeholder="เพิ่ม Header ที่อนุญาต"
											class="flex h-9 w-full rounded-md rounded-r-none border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
										<Button
											size="sm"
											on:click={addNewAllowedHeader}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
												(data.user.id !== data.problem.owner?.id &&
													!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
											class="rounded-l-none">
											<Plus />
										</Button>
									</div>
									<Form.FieldErrors />
								</div>
							</Form.Fieldset>
							<Form.Field {form} name="allowAllHeaders">
								<Form.Control let:attrs>
									<div class="flex items-center space-x-4 pb-4 pl-2">
										<Checkbox
											{...attrs}
											bind:checked={$formData.allowAllHeaders}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
												(data.user.id !== data.problem.owner?.id &&
													!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
										<div>
											<Form.Label>อนุญาติให้ใช้ Header ทั้งหมด</Form.Label>
											<Form.Description>
												อนุญาติให้ใช้ Header ทั้งหมดใน stdlib และ libm
											</Form.Description>
										</div>
									</div>
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Fieldset {form} name="bannedFunctions" class="space-y-0">
								<div class="mb-2">
									<Form.Legend class="mb-3">Functions ที่ห้ามใช้</Form.Legend>
									<Form.Description>
										ชื่อ Function ที่ไม่อนุญาตให้ใช้ในโค้ด ระบบตรวจสอบอาจไม่สามารถตรวจสอบได้ทุกกรณี
									</Form.Description>
								</div>
								<div class="space-y-2">
									<div class="flex flex-wrap gap-2">
										{#each $formData.bannedFunctions ?? [] as bannedFunction}
											<div
												class="flex items-center space-x-1 rounded-lg bg-muted hover:bg-neutral-200 dark:hover:bg-neutral-700">
												<Form.Control let:attrs>
													<Form.Label class="my-2 ml-2 font-normal">
														{bannedFunction}
													</Form.Label>
													<button
														on:click|preventDefault|stopPropagation={() => {
															$formData.bannedFunctions = $formData.bannedFunctions
																? $formData.bannedFunctions.filter((f) => f !== bannedFunction)
																: [];
														}}
														disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
															(data.user.id !== data.problem.owner?.id &&
																!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}>
														<X size={28} class="p-2" />
													</button>
													<input
														hidden
														type="checkbox"
														name={attrs.name}
														value={bannedFunction}
														checked={true} />
												</Form.Control>
											</div>
										{/each}
									</div>
									<div class="flex items-center pt-2">
										<input
											bind:value={newBannedFunction}
											on:keydown|stopPropagation={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addNewBannedFunction();
												}
											}}
											readonly={data.user.id !== data.problem.owner?.id &&
												!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
												(data.user.id === data.problem.owner?.id ||
													isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
											placeholder="เพิ่ม Function ที่ห้ามใช้"
											class="flex h-9 w-full rounded-md rounded-r-none border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
										<Button
											size="sm"
											on:click={addNewBannedFunction}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
												(data.user.id !== data.problem.owner?.id &&
													!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
											class="rounded-l-none">
											<Plus />
										</Button>
									</div>
									<Form.FieldErrors />
								</div>
							</Form.Fieldset>
							<div class="flex space-x-4">
								<div class="w-0 flex-grow">
									<Form.Field {form} name="timeLimit">
										<Form.Control let:attrs>
											<Form.Label>จำกัดเวลาที่โปรแกรมใช้</Form.Label>
											<Form.Description>หน่วยวินาที ความแม่นยำ 0.001 วินาที</Form.Description>
											<Input
												{...attrs}
												bind:value={$formData.timeLimit}
												readonly={data.user.id !== data.problem.owner?.id &&
													!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
												disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
													(data.user.id === data.problem.owner?.id ||
														isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								</div>
								<div class="w-0 flex-grow">
									<Form.Field {form} name="memoryLimit">
										<Form.Control let:attrs>
											<Form.Label>จำกัด Ram ที่โปรแกรมใช้</Form.Label>
											<Form.Description>หน่วย Byte, ไม่รวม Swap</Form.Description>
											<Input
												{...attrs}
												bind:value={$formData.memoryLimit}
												readonly={data.user.id !== data.problem.owner?.id &&
													!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
												disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
													(data.user.id === data.problem.owner?.id ||
														isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								</div>
							</div>
							<Form.Field {form} name="attachments">
								<Form.Control let:attrs>
									<Form.Label>Attachments</Form.Label>
									<div class="flex flex-wrap gap-2">
										{#each $formData.oldAttachments ?? [] as attachment}
											<div
												class="flex items-center space-x-2 rounded-lg bg-muted hover:bg-neutral-200 dark:hover:bg-neutral-700">
												<a
													href={`${PUBLIC_API_URL}${attachment.url}`}
													target="_blank"
													class="my-2 ml-3 font-normal hover:underline">
													{attachment.name}
												</a>
												<button
													on:click|preventDefault|stopPropagation={() => {
														$formData.oldAttachments = $formData.oldAttachments
															? $formData.oldAttachments.filter((a) => a.id !== attachment.id)
															: [];
													}}
													class:cursor-no={data.problem.publicationStatus !==
														PublicationStatus.Draft}
													disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
														(data.user.id !== data.problem.owner?.id &&
															!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}>
													<X size={24} class="mr-2 p-1" />
												</button>
											</div>
										{/each}
									</div>
									<Form.Description>เลือกไฟล์ที่ต้องการเพิ่ม กดกากบาทเพื่อลบไฟล์</Form.Description>
									<FileInput
										{...attrs}
										multiple
										bind:files={$attachments}
										disabled={data.problem.publicationStatus !== PublicationStatus.Draft ||
											(data.user.id !== data.problem.owner?.id &&
												!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="credits">
								<Form.Control let:attrs>
									<Form.Label>Credits</Form.Label>
									<Form.Description>
										แหล่งที่มาของโจทย์ หรือผู้เขียนโจทย์ (ถ้าไม่ใช่ตนเอง)
									</Form.Description>
									<Input
										{...attrs}
										bind:value={$formData.credits}
										readonly={data.user.id !== data.problem.owner?.id &&
											!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
										disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
											(data.user.id === data.problem.owner?.id ||
												isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<div class="space-y-2">
								{#if $errors.exampleTestcases && !isAllNestedUndefined($errors.exampleTestcases)}
									<p class="text-sm font-medium text-destructive">
										Invalid example testcase at # {Object.keys($errors.exampleTestcases)
											.filter((n) => !isAllNestedUndefined($errors.exampleTestcases?.[n]))
											.map((n) => +n + 1)
											.join(', ')}
									</p>
								{/if}
								{#if $errors.testcases && !isAllNestedUndefined($errors.testcases)}
									<p class="text-sm font-medium text-destructive">
										Invalid Testcase at # {Object.keys($errors.testcases)
											.filter((n) => !isAllNestedUndefined($errors.testcases?.[n]))
											.map((n) => +n + 1)
											.join(', ')}
									</p>
								{/if}
							</div>
							<Form.Field {form} name="oldAttachments">
								<Form.Control let:attrs>
									<input name={attrs.name} hidden bind:value={$formData.oldAttachments} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="solution">
								<Form.Control let:attrs>
									<input name={attrs.name} hidden bind:value={$formData.solution} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="starterCode">
								<Form.Control let:attrs>
									<input name={attrs.name} hidden bind:value={$formData.starterCode} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="solutionLanguage">
								<Form.Control let:attrs>
									<input name={attrs.name} hidden bind:value={$formData.solutionLanguage} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="optimizationLevel">
								<Form.Control let:attrs>
									<input name={attrs.name} hidden bind:value={$formData.optimizationLevel} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="exampleTestcases">
								<Form.Control let:attrs>
									<input name={attrs.name} hidden bind:value={$formData.exampleTestcases} />
								</Form.Control>
							</Form.Field>
							<Form.Field {form} name="testcases">
								<Form.Control let:attrs>
									<input name={attrs.name} hidden bind:value={$formData.testcases} />
								</Form.Control>
							</Form.Field>
							{#if data.problem.publicationStatus === PublicationStatus.Approved}
								<div class="pt-2">
									<p class="font-bold text-green-500">Status: Approved!</p>
								</div>
							{/if}
							{#if data.problem.publicationStatus === PublicationStatus.Rejected}
								<div class="pt-2">
									<p class="font-bold text-destructive">Status: Rejected</p>
								</div>
							{/if}
							{#if $formData.reviewComment || (data.problem.publicationStatus === PublicationStatus.AwaitingApproval && data.user.id !== data.problem.owner?.id && isSomeRolesIn( data.user.roles ?? [], [Role.Reviewer] ))}
								<Form.Field {form} name="reviewComment">
									<Form.Control let:attrs>
										<Form.Label>Review Comment</Form.Label>
										<Form.Description>
											Review comment {data.problem.reviewer?.displayName
												? '(โดย ' + data.problem.reviewer.displayName + ')'
												: ''}
										</Form.Description>
										<Textarea
											{...attrs}
											bind:value={$formData.reviewComment}
											placeholder={data.problem.publicationStatus ===
												PublicationStatus.AwaitingApproval &&
											data.user.id !== data.problem.owner?.id &&
											isSomeRolesIn(data.user.roles ?? [], [Role.Reviewer])
												? 'Write your comment here'
												: ''}
											readonly={data.user.id === data.problem.owner?.id ||
												!isSomeRolesIn(data.user.roles ?? [], [Role.Reviewer]) ||
												data.problem.publicationStatus !== PublicationStatus.AwaitingApproval}
											class="h-32 w-full resize-none rounded-lg" />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							{/if}
							<div class="flex items-center space-x-4 pt-4">
								<AlertDialog.Root>
									<AlertDialog.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											variant="destructive"
											class="flex h-10 w-10 items-center justify-center p-0"
											disabled={data.user.id !== data.problem.owner?.id &&
												!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}>
											<Trash2 />
										</Button>
									</AlertDialog.Trigger>
									<AlertDialog.Content>
										<AlertDialog.Header>
											<AlertDialog.Title>ยืนยันการลบโจทย์ใช่หรือไม่</AlertDialog.Title>
											<AlertDialog.Description>
												โจทย์จะถูกลบออกจากระบบและไม่สามารถกู้คืนได้
											</AlertDialog.Description>
										</AlertDialog.Header>
										<AlertDialog.Footer>
											<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
											<AlertDialog.Action on:click={deleteProblem}>ยืนยัน</AlertDialog.Action>
										</AlertDialog.Footer>
									</AlertDialog.Content>
								</AlertDialog.Root>
								{#if data.problem.publicationStatus === PublicationStatus.Draft}
									{#if data.user.id === data.problem.owner?.id || isSomeRolesIn( data.user.roles ?? [], [Role.SuperAdmin] )}
										<Form.Button class="flex w-0 flex-grow items-center space-x-2">
											<Save />
											<p>Save</p>
										</Form.Button>
										<AlertDialog.Root>
											<AlertDialog.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													class="flex w-0 flex-grow items-center space-x-2">
													<ScanSearch />
													<p>Submit for review</p>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>
														ยืนยันการส่งโจทย์เข้าตรวจสอบใช่หรือไม่
													</AlertDialog.Title>
													<AlertDialog.Description>
														เมื่อโจทย์อยู่ในสถานะรอการตรวจสอบจะไม่สามาระแก้ไขได้
														แต่จะสามารถทำการยกเลิกได้
														ซิ่งจะทำให้โจทย์กลับมาสู่สถานะร่างและสามารถแก้ไขได้อีกครั้ง
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
													<AlertDialog.Action on:click={submitProblemForReview}>
														ยืนยัน
													</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
									{:else}
										<Button disabled class="flex w-0 flex-grow items-center space-x-2">
											<Ban />
											<p>This is not your problem</p>
										</Button>
									{/if}
								{:else if data.problem.publicationStatus === PublicationStatus.AwaitingApproval}
									{#if data.user.id === data.problem.owner?.id || (isSomeRolesIn( data.user.roles ?? [], [Role.SuperAdmin] ) && !isSomeRolesIn( data.user.roles ?? [], [Role.Reviewer] ))}
										<AlertDialog.Root>
											<AlertDialog.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													class="flex w-0 flex-grow items-center space-x-2">
													<Undo2 />
													<p>Revert to Draft</p>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>
														ยืนยันการนำโจทยกลับสู่สถานะร่างใช่หรือไม่
													</AlertDialog.Title>
													<AlertDialog.Description>
														เมื่อนำโจทย์กลับสู่สถานะร่างจะทำให้สามารถแก้ไขโจทย์ได้อีกครั้ง
														แต่จะต้องผ่านการตรวจสอบอีกครั้งก่อนที่จะเผยแพร่
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
													<AlertDialog.Action on:click={revertProblemToDraft}>
														ยืนยัน
													</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
										<Button disabled class="flex w-0 flex-grow items-center space-x-2">
											<p>Waiting for approval...</p>
										</Button>
									{:else if isSomeRolesIn(data.user.roles ?? [], [Role.Reviewer])}
										<AlertDialog.Root>
											<AlertDialog.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													class="flex w-0 flex-grow items-center space-x-2">
													<Check />
													<p>Approve</p>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>ยืนยันการอนุมัติโจทย์ใช่หรือไม่</AlertDialog.Title>
													<AlertDialog.Description>
														เมื่ออนุมัติโจทย์แล้วคุณจะไม่สามารถยกเลิกได้
														โดยโจทย์จะต้องถูกเผยแพร่โดยเจ้าของโจทย์อีกครั้งก่อนจะเข้าถึงได้
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
													<AlertDialog.Action on:click={approveProblem}>ยืนยัน</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
										<AlertDialog.Root>
											<AlertDialog.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													variant="destructive"
													class="flex w-0 flex-grow items-center space-x-2">
													<X />
													<p>Reject</p>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>ยืนยันการปฏิเสธโจทย์ใช่หรือไม่</AlertDialog.Title>
													<AlertDialog.Description>
														เมื่อปฏิเสธโจทย์แล้ว
														เจ้าของโจทย์จะสามารถนำโจทย์กลับสู่สถานะร่างเพื่อทำการแก้ไข
														และสามารถส่งโจทย์เข้าตรวจสอบอีกครั้งได้
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
													<AlertDialog.Action on:click={rejectProblem}>ยืนยัน</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
									{:else}
										<Button disabled class="flex w-0 flex-grow items-center space-x-2">
											<Ban />
											<p>This is not your problem</p>
										</Button>
									{/if}
								{:else if data.problem.publicationStatus === PublicationStatus.Approved}
									{#if data.user.id === data.problem.owner?.id || isSomeRolesIn( data.user.roles ?? [], [Role.SuperAdmin] )}
										<AlertDialog.Root>
											<AlertDialog.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													class="flex w-0 flex-grow items-center space-x-2">
													<Undo2 />
													<p>Revert to Draft</p>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>
														ยืนยันการนำโจทยกลับสู่สถานะร่างใช่หรือไม่
													</AlertDialog.Title>
													<AlertDialog.Description>
														เมื่อนำโจทย์กลับสู่สถานะร่างจะทำให้สามารถแก้ไขโจทย์ได้อีกครั้ง
														แต่จะต้องผ่านการตรวจสอบอีกครั้งก่อนที่จะเผยแพร่
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
													<AlertDialog.Action on:click={revertProblemToDraft}>
														ยืนยัน
													</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
										<AlertDialog.Root>
											<AlertDialog.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													class="flex w-0 flex-grow items-center space-x-2">
													<Rocket />
													<p>Publish</p>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>ยืนยันการเผยแพร่โจทย์ใช่หรือไม่</AlertDialog.Title>
													<AlertDialog.Description>
														เมื่อเผยแพร่โจทย์แล้วจะทำให้โจทย์สามารถเข้าถึงได้จากทุกคน
														และมีการนับคะแนนเมื่อทำสำเร็จ
														โดยเมื่อเผยแพร่แล้วจะไม่สามารถแก้ไขหรือยกเลิกโจทย์ได้
														ยกเว้นการเก็บถาวรเท่านั้น
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
													<AlertDialog.Action on:click={publishProblem}>ยืนยัน</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
									{:else}
										<Button disabled class="flex w-0 flex-grow items-center space-x-2">
											<Ban />
											<p>This is not your problem</p>
										</Button>
									{/if}
								{:else if data.problem.publicationStatus === PublicationStatus.Rejected}
									{#if data.user.id === data.problem.owner?.id || isSomeRolesIn( data.user.roles ?? [], [Role.SuperAdmin] )}
										<AlertDialog.Root>
											<AlertDialog.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													class="flex w-0 flex-grow items-center space-x-2">
													<Undo2 />
													<p>Revert to Draft</p>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>
														ยืนยันการนำโจทยกลับสู่สถานะร่างใช่หรือไม่
													</AlertDialog.Title>
													<AlertDialog.Description>
														เมื่อนำโจทย์กลับสู่สถานะร่างจะทำให้สามารถแก้ไขโจทย์ได้อีกครั้ง
														แต่จะต้องผ่านการตรวจสอบอีกครั้งก่อนที่จะเผยแพร่
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
													<AlertDialog.Action on:click={revertProblemToDraft}>
														ยืนยัน
													</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
									{:else}
										<Button disabled class="flex w-0 flex-grow items-center space-x-2">
											<Ban />
											<p>This is not your problem</p>
										</Button>
									{/if}
								{:else if data.problem.publicationStatus === PublicationStatus.Published}
									{#if data.user.id === data.problem.owner?.id || isSomeRolesIn( data.user.roles ?? [], [Role.SuperAdmin] )}
										<AlertDialog.Root>
											<AlertDialog.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													class="flex w-0 flex-grow items-center space-x-2">
													<Archive />
													<p>Archive</p>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>ยืนยันการเก็บโจทย์ถาวรใช่หรือไม่</AlertDialog.Title>
													<AlertDialog.Description>
														เมื่อเก็บโจทย์ถาวรจะไม่สามารถแก้ไขหรือนำโจทย์กลับมาได้อีก
														โจทย์ในสถานะนี้จะไม่สามารถเข้าถึงได้จากผู้ร่วมงาน และจะไม่มีการนับคะแนน
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
													<AlertDialog.Action on:click={archiveProblem}>ยืนยัน</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
									{:else}
										<Button disabled class="flex w-0 flex-grow items-center space-x-2">
											<Ban />
											<p>This is not your problem</p>
										</Button>
									{/if}
								{:else if data.problem.publicationStatus === PublicationStatus.Archived}
									{#if data.user.id === data.problem.owner?.id || isSomeRolesIn( data.user.roles ?? [], [Role.SuperAdmin] )}
										<Button disabled class="flex w-0 flex-grow items-center space-x-2">
											<Archive />
											<p>Archived</p>
										</Button>
									{:else}
										<Button disabled class="flex w-0 flex-grow items-center space-x-2">
											<Ban />
											<p>This is not your problem</p>
										</Button>
									{/if}
								{/if}
							</div>
						</form>
						<FormMessage message={$message} class="mx-2 mt-2" />
					</ScrollArea>
				</div>
			</Tabs.Content>
			<Tabs.Content value="examples">
				<div class="space-y-2">
					<div class="mr-4 flex space-x-2">
						<Button
							disabled={examples.length >= 16 ||
								data.problem.publicationStatus !== PublicationStatus.Draft ||
								(data.user.id !== data.problem.owner?.id &&
									!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
							on:click={() => {
								examples = [
									...examples,
									{
										id: crypto.randomUUID(),
										input: '',
										output: '',
										passed: undefined,
										errCode: undefined,
										time: undefined,
										memory: undefined
									}
								];
							}}
							class="flex w-0 flex-grow items-center space-x-2">
							<Plus />
							<p>Add Testcase</p>
						</Button>
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
										transition:fade={{ duration: fadeDuration }}
										animate:flip={{ duration: flipDuration }}>
										<EditableTestcase
											number={i + 1}
											bind:input
											bind:output
											error={$errors.exampleTestcases?.[i]}
											{passed}
											{errCode}
											{time}
											{memory}
											on:exitButtonClicked={() => {
												examples = examples.filter((testcase) => testcase.id !== id);
											}}
											readonly={data.user.id !== data.problem.owner?.id &&
												!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
												(data.user.id === data.problem.owner?.id ||
													isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
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
							disabled={testcases.length >= 64 ||
								data.problem.publicationStatus !== PublicationStatus.Draft ||
								(data.user.id !== data.problem.owner?.id &&
									!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))}
							on:click={() => {
								testcases = [
									...testcases,
									{
										id: crypto.randomUUID(),
										input: '',
										output: '',
										passed: undefined,
										errCode: undefined,
										time: undefined,
										memory: undefined
									}
								];
							}}
							class="flex w-0 flex-grow items-center space-x-2">
							<Plus />
							<p>Add Testcase</p>
						</Button>
						{#if waiting}
							<Button disabled class="flex w-0 flex-grow items-center space-x-2">
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
								<p>Running...</p>
							</Button>
						{:else}
							<Button class="flex w-0 flex-grow items-center space-x-2" on:click={testTestcases}>
								<CirclePlay />
								<p>Test</p>
							</Button>
						{/if}
					</div>
					<div style="height: calc(100vh - 180px);">
						<ScrollArea class="h-full pr-4">
							<div class="space-y-2">
								{#each testcases as { id, input, output, passed, errCode, time, memory }, i (id)}
									<div
										class="rounded-lg bg-muted p-2"
										transition:fade={{ duration: fadeDuration }}
										animate:flip={{ duration: flipDuration }}>
										<EditableTestcase
											number={i + 1}
											bind:input
											bind:output
											error={$errors.testcases?.[i]}
											{errCode}
											{passed}
											{time}
											{memory}
											on:exitButtonClicked={() => {
												if (testcases.length === 1) {
													toast.error('At least one testcase is required');
													return;
												}
												testcases = testcases.filter((testcase) => testcase.id !== id);
											}}
											readonly={data.user.id !== data.problem.owner?.id &&
												!isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin])}
											disabled={data.problem.publicationStatus !== PublicationStatus.Draft &&
												(data.user.id === data.problem.owner?.id ||
													isSomeRolesIn(data.user.roles ?? [], [Role.SuperAdmin]))} />
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
	.cursor-no {
		@apply cursor-not-allowed;
	}
</style>
