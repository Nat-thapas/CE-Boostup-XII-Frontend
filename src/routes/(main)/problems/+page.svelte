<script lang="ts">
	import { ArrowDown, ArrowUp, ChevronDown, Plus, Search, Star } from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	import Problem from '$lib/components/problem/Problem.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Select from '$lib/components/ui/select';
	import { CompletionStatus } from '$lib/enums/completion-status.enum';
	import { PublicationStatus } from '$lib/enums/publication-status.enum';
	import { Role } from '$lib/enums/role.enum';
	import { isSomeRolesIn } from '$lib/roles';
	import { setSearchParams } from '$lib/set-search-params';

	import type { PageData } from './$types';

	const completionStatuses: Record<string, string> = {
		[CompletionStatus.Attempted]: 'ลองทำแล้ว',
		[CompletionStatus.Unattempted]: 'ยังไม่ได้ทำ',
		[CompletionStatus.Solved]: 'ผ่านแล้ว'
	};

	const publicationStatuses: Record<string, string> = {
		[PublicationStatus.Draft]: 'ร่าง',
		[PublicationStatus.AwaitingApproval]: 'รอการอนุมัติ',
		[PublicationStatus.Approved]: 'อนุมัติแล้ว',
		[PublicationStatus.Rejected]: 'ปฏิเสธ',
		[PublicationStatus.Published]: 'เผยแพร่แล้ว',
		[PublicationStatus.Archived]: 'เก็บถาวร'
	};

	export let data: PageData;

	$: currentPage = data.problems.page;

	$: isUserStaffOrHigher = isSomeRolesIn(data.user?.roles ?? [], [
		Role.Staff,
		Role.Admin,
		Role.SuperAdmin
	]);

	$: url = $page.url;

	let search = data.params.search ?? '';
	let tagsStatus = Object.fromEntries(
		data.problemTags.data.map((tag) => [
			tag.id,
			(data.params.tags ?? '').split(',').includes(tag.id)
		])
	);

	$: tags = data.problemTags.data.filter((tag) => tagsStatus[tag.id]).map((tag) => tag.id);

	let difficulty = data.params.difficulties
		? parseInt((data.params.difficulties as string).split(',')[0])
		: undefined;

	let completionStatus = data.params.completionStatus ?? undefined;

	const selectedCompletionStatus = completionStatus
		? {
				value: completionStatus,
				label: completionStatuses[completionStatus as string]
			}
		: {
				value: 'All',
				label: 'ทั้งหมด'
			};
	let publicationStatus = data.params.publicationStatus ?? undefined;

	const selectedPublicationStatus = publicationStatus
		? {
				value: publicationStatus,
				label: publicationStatuses[publicationStatus as string]
			}
		: {
				value: 'All',
				label: 'ทั้งหมด'
			};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let myProblemsOnly = data.params.owner === data.user.id;

	let sort = data.params.sort ?? undefined;
</script>

<svelte:head>
	<title>CE Boostup XII - Problems</title>
</svelte:head>

<div class="mx-8 my-2">
	<div class="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
		<form
			on:submit|preventDefault={() => {
				goto(`${url.pathname}?${setSearchParams(url.search, { search, page: undefined })}`);
			}}
			class="flex w-64 flex-grow-[999] items-center">
			<Input
				placeholder="ค้นหาด้วยเลขข้อหรือชื่อโจทย์"
				bind:value={search}
				class="flex-grow rounded-r-none" />
			<Button type="submit" class="rounded-l-none" aria-label="Search"><Search /></Button>
		</form>
		<DropdownMenu.Root
			onOpenChange={(open) => {
				if (!open) {
					goto(
						`${url.pathname}?${setSearchParams(url.search, { tags: tags.join(','), page: undefined })}`
					);
				}
			}}
			closeOnItemClick={false}>
			<DropdownMenu.Trigger asChild let:builder>
				<Button
					variant="outline"
					builders={[builder]}
					class="flex w-28 flex-grow items-center justify-between">
					<p class="!text-sm !font-normal">เนื้อหา</p>
					<ChevronDown class="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-48">
				<DropdownMenu.Label>เลือกเนื้อหา</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#each data.problemTags.data as tag (tag.id)}
					<DropdownMenu.CheckboxItem bind:checked={tagsStatus[tag.id]}>
						{tag.name}
					</DropdownMenu.CheckboxItem>
				{:else}
					<DropdownMenu.Item disabled>ไม่มีเนื้อหา</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<div
			class="flex h-10 flex-grow items-center space-x-2 rounded-md border border-border px-4 py-2"
			on:click={() => {
				difficulty = undefined;
				goto(
					`${url.pathname}?${setSearchParams(url.search, { difficulties: difficulty, page: undefined })}`
				);
			}}
			on:keydown={(e) => {
				if (e.key === 'Enter') {
					difficulty = undefined;
					goto(
						`${url.pathname}?${setSearchParams(url.search, { difficulties: difficulty, page: undefined })}`
					);
				}
			}}
			role="button"
			tabindex="0">
			<p class="!text-sm !font-normal">ความยาก</p>
			<div class="flex items-center">
				<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
				{#each Array(5) as _, i}
					<button
						on:click|stopPropagation={() => {
							if (difficulty === i + 1) {
								difficulty = undefined;
							} else {
								difficulty = i + 1;
							}
							goto(
								`${url.pathname}?${setSearchParams(url.search, { difficulties: difficulty, page: undefined })}`
							);
						}}
						aria-label={`Difficulty: ${i + 1}`}>
						<Star
							color="#E2AD39"
							size={24}
							fill="#E2AD39"
							fill-opacity={i < (difficulty ?? 0) ? 1 : 0} />
					</button>
				{/each}
			</div>
		</div>
		<Select.Root
			selected={selectedCompletionStatus}
			onSelectedChange={(v) => {
				if (v) {
					if (v.value === 'All') {
						completionStatus = undefined;
						goto(
							`${url.pathname}?${setSearchParams(url.search, { completionStatus, page: undefined })}`
						);
					} else {
						completionStatus = v.value;
						goto(
							`${url.pathname}?${setSearchParams(url.search, { completionStatus, page: undefined })}`
						);
					}
				}
			}}>
			<Select.Trigger class="w-32 flex-grow" aria-label="Completion Status">
				<Select.Value placeholder="สถานะ" />
			</Select.Trigger>
			<Select.Content>
				<Select.SelectLabel>สถานะ</Select.SelectLabel>
				<Select.Item value="All">ทั้งหมด</Select.Item>
				{#each Object.entries(completionStatuses) as [key, value]}
					<Select.Item value={key}>{value}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		{#if isUserStaffOrHigher}
			<Select.Root
				selected={selectedPublicationStatus}
				onSelectedChange={(v) => {
					if (v) {
						if (v.value === 'All') {
							publicationStatus = undefined;
							goto(
								`${url.pathname}?${setSearchParams(url.search, { publicationStatus, page: undefined })}`
							);
						} else {
							publicationStatus = v.value;
							goto(
								`${url.pathname}?${setSearchParams(url.search, { publicationStatus, page: undefined })}`
							);
						}
					}
				}}>
				<Select.Trigger class="w-32 flex-grow" aria-label="Publication Status">
					<Select.Value placeholder="สถานะโจทย์" />
				</Select.Trigger>
				<Select.Content>
					<Select.SelectLabel>สถานะโจทย์</Select.SelectLabel>
					<Select.Item value="All">ทั้งหมด</Select.Item>
					{#each Object.entries(publicationStatuses) as [key, value]}
						<Select.Item value={key}>{value}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<div
				class="flex h-10 flex-grow items-center space-x-2 rounded-lg border border-border px-4 py-2">
				<Checkbox
					id="my-problems-only-checkbox"
					onCheckedChange={(v) => {
						if (v) {
							myProblemsOnly = true;
							goto(
								`${url.pathname}?${setSearchParams(url.search, { owner: data.user.id, page: undefined })}`
							);
						} else {
							myProblemsOnly = false;
							goto(
								`${url.pathname}?${setSearchParams(url.search, { owner: undefined, page: undefined })}`
							);
						}
					}}
					aria-label="My problems only" />
				<Label for="my-problems-only-checkbox" class="text-sm font-normal">เฉพาะโจทย์ของฉัน</Label>
			</div>
		{/if}
	</div>
	<div class="flex w-full flex-nowrap rounded-lg px-4 py-3">
		<button
			on:click={() => {
				if (sort === 'number') {
					sort = '-number';
				} else {
					sort = 'number';
				}
				goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
			}}
			class="mr-4 flex w-8 items-center lg:w-12 lg:space-x-1">
			<p>ข้อ</p>
			{#if sort === 'number'}
				<ArrowUp size={16} />
			{:else if sort === '-number'}
				<ArrowDown size={16} />
			{/if}
		</button>
		<div class="mr-4 flex w-0 flex-grow space-x-4">
			<button
				on:click={() => {
					if (sort === 'title') {
						sort = '-title';
					} else {
						sort = 'title';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="flex w-full items-center space-x-1 overflow-hidden text-ellipsis text-nowrap md:w-1/2">
				<p>ชื่อโจทย์</p>
				{#if sort === 'title'}
					<ArrowUp size={16} />
				{:else if sort === '-title'}
					<ArrowDown size={16} />
				{/if}
			</button>
			<p class="hidden w-1/2 overflow-hidden text-ellipsis text-nowrap md:inline">เนื้อหา</p>
		</div>
		<div class="flex space-x-4">
			<p class="hidden w-44 overflow-hidden text-ellipsis text-nowrap xl:inline">ผู้ออกโจทย์</p>
			<button
				on:click={() => {
					if (sort === 'difficulty') {
						sort = '-difficulty';
					} else {
						sort = 'difficulty';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="hidden w-32 items-center space-x-1 sm:flex md:w-36 lg:w-44">
				<p>ความยาก</p>
				{#if sort === 'difficulty'}
					<ArrowUp size={16} />
				{:else if sort === '-difficulty'}
					<ArrowDown size={16} />
				{/if}
			</button>
			<button
				on:click={() => {
					if (sort === 'score') {
						sort = '-score';
					} else {
						sort = 'score';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="flex w-16 items-center space-x-1 lg:w-24">
				<p>คะแนน</p>
				{#if sort === 'score'}
					<ArrowUp size={16} />
				{:else if sort === '-score'}
					<ArrowDown size={16} />
				{/if}
			</button>
			<button
				on:click={() => {
					if (sort === 'userSolvedCount') {
						sort = '-userSolvedCount';
					} else {
						sort = 'userSolvedCount';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="hidden w-12 items-center space-x-1 md:flex lg:w-20">
				<p>ผ่าน</p>
				{#if sort === 'userSolvedCount'}
					<ArrowUp size={16} />
				{:else if sort === '-userSolvedCount'}
					<ArrowDown size={16} />
				{/if}
			</button>
			<p class="hidden w-20 pl-2 sm:inline xl:pl-0 xl:text-left">สถานะ</p>
			{#if isUserStaffOrHigher}
				<p class="hidden w-24 text-right xl:inline">สถานะโจทย์</p>
			{/if}
		</div>
	</div>
	<div class="space-y-2">
		{#each data.problems.data as problem (problem.id)}
			<a href={`${base}/problems/${problem.id}`} class="block">
				<Problem
					{problem}
					includePublicationStatus={isUserStaffOrHigher}
					class="w-full rounded-lg bg-muted px-4 py-3 transition-all hover:scale-105 hover:bg-neutral-200 dark:hover:bg-neutral-700 md:hover:scale-[1.04] lg:hover:scale-[1.03] xl:hover:scale-[1.02] 2xl:hover:scale-[1.01]" />
			</a>
		{:else}
			<p class="text-center my-4">ไม่พบโจทย์ที่ค้นหา</p>
		{/each}
	</div>
	<Pagination.Root
		count={data.problems.total || 1}
		perPage={data.problems.perPage}
		let:pages
		onPageChange={(newPage) => {
			goto(`${url.pathname}?${setSearchParams(url.search, { page: newPage })}`);
		}}
		class="mb-2 mt-4">
		<Pagination.Content>
			<Pagination.Item>
				<Pagination.PrevButton />
			</Pagination.Item>
			{#each pages as page (page.key)}
				{#if page.type === 'ellipsis'}
					<Pagination.Item>
						<Pagination.Ellipsis />
					</Pagination.Item>
				{:else}
					<Pagination.Item>
						<Pagination.Link {page} isActive={currentPage == page.value}>
							{page.value}
						</Pagination.Link>
					</Pagination.Item>
				{/if}
			{/each}
			<Pagination.Item>
				<Pagination.NextButton />
			</Pagination.Item>
		</Pagination.Content>
	</Pagination.Root>
</div>
{#if isUserStaffOrHigher}
	<a href={`${base}/problems/create`} class="fixed bottom-4 right-4">
		<Button
			class="h-16 w-16 rounded-full p-4 transition-transform hover:scale-110"
			aria-label="Create">
			<Plus size={32} />
		</Button>
		<p class="sr-only">Create</p>
	</a>
{/if}

<style lang="postcss">
	p {
		@apply text-nowrap text-base font-medium;
	}
</style>
