<script lang="ts">
	import { ArrowDown, ArrowUp, Plus, PlusCircle, Save, Search, Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { fileProxy, superForm, type Infer } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_ACCEPTED_IMAGE_TYPES, PUBLIC_API_URL } from '$env/static/public';

	import Group from '$lib/components/group/Group.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import FileInput from '$lib/components/ui/FileInput.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Pagination from '$lib/components/ui/pagination';
	import { Role } from '$lib/enums/role.enum';
	import { isSomeRolesIn } from '$lib/roles';
	import { formSchema as createGroupFormSchema } from '$lib/schemas/create-group.schema';
	import { formSchema as editGroupFormSchema } from '$lib/schemas/edit-group.schema';
	import { setSearchParams } from '$lib/set-search-params';

	import type { PageData } from './$types';

	export let data: PageData;

	$: currentPage = data.groups.page;

	$: isUserAdminOrHigher = isSomeRolesIn(data.user?.roles ?? [], [Role.Admin, Role.SuperAdmin]);

	$: url = $page.url;

	let search = data.params.search ?? '';
	let sort = data.params.sort ?? undefined;

	const createGroupForm = superForm<Infer<typeof createGroupFormSchema>>(data.createGroupForm, {
		validators: zodClient(createGroupFormSchema),

		applyAction: true,

		onUpdated({ form }) {
			if (form.message) {
				switch (form.message.type) {
					case 'success':
						toast.success(form.message.text);
						createGroupDialogOpen = false;
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

	const { form: createGroupFormData, enhance: createGroupEnhance } = createGroupForm;

	const editGroupForm = superForm<Infer<typeof editGroupFormSchema>>(data.editGroupForm, {
		validators: zodClient(editGroupFormSchema),

		applyAction: true,

		onUpdated({ form }) {
			if (form.message) {
				switch (form.message.type) {
					case 'success':
						toast.success(form.message.text);
						editGroupDialogOpen = false;
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

	const { form: editGroupFormData, enhance: editGroupEnhance } = editGroupForm;

	let createGroupDialogOpen = false;
	let editGroupDialogOpen = false;

	const createGroupAvatar = fileProxy(createGroupForm, 'avatar');
	const editGroupAvatar = fileProxy(editGroupForm, 'avatar');

	async function sendDeleteGroupRequest(id: string): Promise<void> {
		const response = await fetch(`${PUBLIC_API_URL}/groups/${id}`, {
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

	async function deleteGroup(id: string) {
		const requestPromise = sendDeleteGroupRequest(id);

		toast.promise(requestPromise, {
			loading: 'Deleting group...',
			success: () => {
				editGroupDialogOpen = false;
				invalidateAll();
				return 'Group deleted successfully!';
			},
			error: (err) => {
				console.error(err);
				editGroupDialogOpen = false;
				invalidateAll();
				return `Failed to delete group: ${err instanceof Error ? err.message : 'Unknown error'}`;
			}
		});
	}
</script>

<svelte:head>
	<title>CE Boostup XII - Groups</title>
</svelte:head>

<Dialog.Root bind:open={createGroupDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>สร้างกลุ่ม</Dialog.Title>
			<Dialog.Description></Dialog.Description>
			<form
				method="POST"
				action="?/create_group"
				enctype="multipart/form-data"
				use:createGroupEnhance
				class="space-y-4 px-2">
				<Form.Field form={createGroupForm} name="name">
					<Form.Control let:attrs>
						<Form.Label>ชื่อกลุ่ม</Form.Label>
						<Input {...attrs} bind:value={$createGroupFormData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={createGroupForm} name="description">
					<Form.Control let:attrs>
						<Form.Label>คำอธิบายกลุ่ม (ไม่จำเป็น)</Form.Label>
						<Input {...attrs} bind:value={$createGroupFormData.description} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={createGroupForm} name="avatar">
					<Form.Control let:attrs>
						<Form.Label>Avatar</Form.Label>
						<FileInput
							{...attrs}
							bind:files={$createGroupAvatar}
							accept={PUBLIC_ACCEPTED_IMAGE_TYPES} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="flex w-full items-center space-x-2">
					<PlusCircle />
					<p>สร้าง</p>
				</Form.Button>
			</form>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editGroupDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>แก้ไขกลุ่ม</Dialog.Title>
			<Dialog.Description></Dialog.Description>
			<form
				method="POST"
				action="?/edit_group"
				enctype="multipart/form-data"
				use:editGroupEnhance
				class="space-y-4 px-2">
				<Form.Field form={editGroupForm} name="id">
					<Form.Control let:attrs>
						<input name={attrs.name} hidden bind:value={$editGroupFormData.id} />
					</Form.Control>
				</Form.Field>
				<Form.Field form={editGroupForm} name="name">
					<Form.Control let:attrs>
						<Form.Label>ชื่อกลุ่ม</Form.Label>
						<Input {...attrs} bind:value={$editGroupFormData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={editGroupForm} name="description">
					<Form.Control let:attrs>
						<Form.Label>คำอธิบายกลุ่ม (ไม่จำเป็น)</Form.Label>
						<Input {...attrs} bind:value={$editGroupFormData.description} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={editGroupForm} name="avatar">
					<Form.Control let:attrs>
						<Form.Label>Avatar</Form.Label>
						<FileInput
							{...attrs}
							bind:files={$editGroupAvatar}
							accept={PUBLIC_ACCEPTED_IMAGE_TYPES} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<div class="flex items-center space-x-2">
					<AlertDialog.Root>
						<AlertDialog.Trigger asChild let:builder>
							<Button
								builders={[builder]}
								variant="destructive"
								class="flex w-0 flex-grow items-center space-x-2">
								<Trash2 />
								<p>ลบกลุ่ม</p>
							</Button>
						</AlertDialog.Trigger>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title>ยืนยันการลบกลุ่มใช่หรือไม่</AlertDialog.Title>
								<AlertDialog.Description>
									กลุ่มจะถูกลบออกจากระบบและไม่สามารถกู้คืนได้
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
								<AlertDialog.Action
									on:click={() => {
										deleteGroup($editGroupFormData.id);
									}}>
									ยืนยัน
								</AlertDialog.Action>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
					<Form.Button class="flex w-0 flex-grow items-center space-x-2">
						<Save />
						<p>Save</p>
					</Form.Button>
				</div>
			</form>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

<div class="mx-8 my-2">
	<div class="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
		<form
			on:submit|preventDefault={() => {
				goto(`${url.pathname}?${setSearchParams(url.search, { search, page: undefined })}`);
			}}
			class="flex w-64 flex-grow-[999] items-center">
			<Input placeholder="ค้นหาชื่อกลุ่ม" bind:value={search} class="flex-grow rounded-r-none" />
			<Button type="submit" class="rounded-l-none" aria-label="Search"><Search /></Button>
		</form>
	</div>
	<div class="flex w-full flex-nowrap rounded-lg px-4 py-3">
		<div class="mr-4 flex w-0 flex-grow items-center space-x-4 xl:ml-14">
			<button
				on:click={() => {
					if (sort === 'name') {
						sort = '-name';
					} else {
						sort = 'name';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="flex w-full items-center lg:space-x-2">
				<p class="text-sm">ชื่อ</p>
				{#if sort === 'name'}
					<ArrowUp size={16} />
				{:else if sort === '-name'}
					<ArrowDown size={16} />
				{/if}
			</button>
		</div>
		<div class="flex items-center space-x-4">
			<button
				on:click={() => {
					if (sort === 'memberCount') {
						sort = '-memberCount';
					} else {
						sort = 'memberCount';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="hidden w-16 items-center sm:flex md:w-20 lg:space-x-2">
				<p class="text-sm">สมาชิก</p>
				{#if sort === 'memberCount'}
					<ArrowUp size={16} />
				{:else if sort === '-memberCount'}
					<ArrowDown size={16} />
				{/if}
			</button>
			<button
				on:click={() => {
					if (sort === 'totalScore') {
						sort = '-totalScore';
					} else {
						sort = 'totalScore';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="flex w-16 items-center text-left md:w-24 lg:space-x-2">
				<p class="text-sm">คะแนนรวม</p>
				{#if sort === 'totalScore'}
					<ArrowUp size={16} class="flex-shrink-0" />
				{:else if sort === '-totalScore'}
					<ArrowDown size={16} class="flex-shrink-0" />
				{/if}
			</button>
			<button
				on:click={() => {
					if (sort === 'uniqueTotalScore') {
						sort = '-uniqueTotalScore';
					} else {
						sort = 'uniqueTotalScore';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="flex w-16 items-center text-left md:w-24 lg:space-x-2">
				<p class="text-sm">คะแนนไม่ซ้ำ</p>
				{#if sort === 'uniqueTotalScore'}
					<ArrowUp size={16} class="flex-shrink-0" />
				{:else if sort === '-uniqueTotalScore'}
					<ArrowDown size={16} class="flex-shrink-0" />
				{/if}
			</button>
			<button
				on:click={() => {
					if (sort === 'problemSolvedCount') {
						sort = '-problemSolvedCount';
					} else {
						sort = 'problemSolvedCount';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="flex w-16 items-center text-left md:w-24 lg:space-x-2">
				<p class="text-sm">โจทย์รวม</p>
				{#if sort === 'problemSolvedCount'}
					<ArrowUp size={16} class="flex-shrink-0" />
				{:else if sort === '-problemSolvedCount'}
					<ArrowDown size={16} class="flex-shrink-0" />
				{/if}
			</button>
			<button
				on:click={() => {
					if (sort === 'uniqueProblemSolvedCount') {
						sort = '-uniqueProblemSolvedCount';
					} else {
						sort = 'uniqueProblemSolvedCount';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="flex w-16 items-center text-left md:w-24 lg:space-x-2">
				<p class="text-sm">โจทย์ไม่ซ้ำ</p>
				{#if sort === 'uniqueProblemSolvedCount'}
					<ArrowUp size={16} class="flex-shrink-0" />
				{:else if sort === '-uniqueProblemSolvedCount'}
					<ArrowDown size={16} class="flex-shrink-0" />
				{/if}
			</button>
			<button
				on:click={() => {
					if (sort === 'lastProblemSolvedAt') {
						sort = '-lastProblemSolvedAt';
					} else {
						sort = 'lastProblemSolvedAt';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="hidden w-48 text-right lg:flex lg:space-x-2">
				<p class="text-sm">ผ่านโจทย์ล่าสุด</p>
				{#if sort === 'lastProblemSolvedAt'}
					<ArrowUp size={16} />
				{:else if sort === '-lastProblemSolvedAt'}
					<ArrowDown size={16} />
				{/if}
			</button>
		</div>
	</div>
	<div class="space-y-2">
		{#each data.groups.data as group (group.id)}
			<button
				class="w-full text-left"
				on:click={() => {
					$editGroupFormData.id = group.id;
					$editGroupFormData.name = group.name ?? '';
					$editGroupFormData.description = group.description;
					editGroupDialogOpen = true;
				}}
				disabled={!isUserAdminOrHigher}>
				<Group
					{group}
					class="w-full rounded-lg bg-muted px-4 py-3 transition-all hover:scale-105 hover:bg-neutral-200 dark:hover:bg-neutral-700 md:hover:scale-[1.04] lg:hover:scale-[1.03] xl:hover:scale-[1.02] 2xl:hover:scale-[1.01]" />
			</button>
		{:else}
			<p class="text-center my-4">ไม่พบกลุ่มที่ค้นหา</p>
		{/each}
	</div>
	<Pagination.Root
		count={data.groups.total || 1}
		perPage={data.groups.perPage}
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
{#if isUserAdminOrHigher}
	<Button
		on:click={() => {
			createGroupDialogOpen = true;
		}}
		class="fixed bottom-4 right-4 h-16 w-16 rounded-full p-4 transition-transform hover:scale-110"
		aria-label="Create">
		<Plus size={32} />
	</Button>
{/if}
