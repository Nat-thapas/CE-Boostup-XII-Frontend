<script lang="ts">
	import {
		ArrowDown,
		ArrowUp,
		ChevronDown,
		CirclePlus,
		Plus,
		Save,
		Search,
		Trash2
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { fileProxy, superForm, type Infer } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_ACCEPTED_IMAGE_TYPES, PUBLIC_API_URL } from '$env/static/public';

	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import FileInput from '$lib/components/ui/FileInput.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Pagination from '$lib/components/ui/pagination';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Select from '$lib/components/ui/select';
	import User from '$lib/components/user/User.svelte';
	import { Role } from '$lib/enums/role.enum';
	import { getInitial } from '$lib/get-initial';
	import { isSomeRolesIn } from '$lib/roles';
	import { formSchema as createUserFormSchema } from '$lib/schemas/create-user.schema';
	import { formSchema as editUserFormSchema } from '$lib/schemas/edit-user.schema';
	import { setSearchParams } from '$lib/set-search-params';

	import type { PageData } from './$types';

	export let data: PageData;

	const roles: Record<string, string> = {
		[Role.User]: 'User',
		[Role.Staff]: 'Staff',
		[Role.Reviewer]: 'Reviewer',
		[Role.Admin]: 'Admin',
		[Role.SuperAdmin]: 'Super Admin'
	};

	const rolesArray: Role[] = [Role.User, Role.Staff, Role.Reviewer, Role.Admin, Role.SuperAdmin];

	function getGroupName(groupId?: string | null): string | undefined {
		if (groupId === undefined || groupId === null) return 'No group';
		return data.groups.data.find((group) => group.id === groupId)?.name ?? 'No group';
	}

	$: currentPage = data.users.page;

	$: isUserAdminOrHigher = isSomeRolesIn(data.user?.roles ?? [], [Role.Admin, Role.SuperAdmin]);
	$: isUserSuperAdmin = isSomeRolesIn(data.user?.roles ?? [], [Role.SuperAdmin]);

	$: url = $page.url;

	let search = data.params.search ?? '';
	let sort = data.params.sort ?? undefined;

	let rolesStatus = Object.fromEntries(
		rolesArray.map((role) => [role, (data.params.roles ?? '').split(',').includes(role)])
	);

	$: checkedRoles = rolesArray.filter((role) => rolesStatus[role]);

	let group = data.params.group ?? undefined;

	$: selectedFilterGroup = {
		value: group ?? 'All',
		label: data.groups.data.find((group) => group.id === data.params.group)?.name ?? 'ทั้งหมด'
	};

	const createUserForm = superForm<Infer<typeof createUserFormSchema>>(data.createUserForm, {
		validators: zodClient(createUserFormSchema),

		applyAction: true,

		dataType: 'json',

		onUpdated({ form }) {
			if (form.message) {
				switch (form.message.type) {
					case 'success':
						toast.success(form.message.text);
						createUserDialogOpen = false;
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

	const { form: createUserFormData, enhance: createUserEnhance } = createUserForm;

	const editUserForm = superForm<Infer<typeof editUserFormSchema>>(data.editUserForm, {
		validators: zodClient(editUserFormSchema),

		applyAction: true,

		dataType: 'json',

		onUpdated({ form }) {
			if (form.message) {
				switch (form.message.type) {
					case 'success':
						toast.success(form.message.text);
						editUserDialogOpen = false;
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

	const { form: editUserFormData, enhance: editUserEnhance } = editUserForm;

	let createUserDialogOpen = false;
	let editUserDialogOpen = false;

	const editUserAvatar = fileProxy(editUserForm, 'avatar');

	$: selectedCreateUserGroup = {
		label: getGroupName($createUserFormData.group),
		value: $createUserFormData.group ?? undefined
	};

	$: selectedEditUserGroup = {
		label: getGroupName($editUserFormData.group),
		value: $editUserFormData.group ?? undefined
	};

	async function sendDeleteUserRequest(id: string): Promise<void> {
		const response = await fetch(`${PUBLIC_API_URL}/users/${id}`, {
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

	function deleteUser(id: string): void {
		const requestPromise = sendDeleteUserRequest(id);

		toast.promise(requestPromise, {
			loading: 'Deleting user...',
			success: () => {
				editUserDialogOpen = false;
				invalidateAll();
				return 'User deleted successfully!';
			},
			error: (err) => {
				console.error(err);
				editUserDialogOpen = false;
				invalidateAll();
				return `Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`;
			}
		});
	}
</script>

<svelte:head>
	<title>CE Boostup XII - Users</title>
</svelte:head>

<Dialog.Root bind:open={createUserDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>สร้างผู้ใช้</Dialog.Title>
			<Dialog.Description></Dialog.Description>
		</Dialog.Header>
		<ScrollArea class="max-h-[75vh]">
			<form method="POST" action="?/create_user" use:createUserEnhance class="space-y-4 px-2">
				<Form.Field form={createUserForm} name="displayName">
					<Form.Control let:attrs>
						<Form.Label>ชื่อที่จะแสดง</Form.Label>
						<Input {...attrs} bind:value={$createUserFormData.displayName} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={createUserForm} name="email">
					<Form.Control let:attrs>
						<Form.Label>Email</Form.Label>
						<Input {...attrs} bind:value={$createUserFormData.email} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Fieldset form={createUserForm} name="roles">
					<Form.Legend>Roles</Form.Legend>
					{#each rolesArray as role}
						{@const checked = $createUserFormData.roles.includes(role)}
						<Form.Control let:attrs>
							<div class="flex items-center space-x-2">
								<Checkbox
									{...attrs}
									{checked}
									onCheckedChange={(v) => {
										if (v) {
											$createUserFormData.roles = [...$createUserFormData.roles, role];
										} else {
											$createUserFormData.roles = $createUserFormData.roles.filter(
												(r) => r !== role
											);
										}
									}} />
								<Form.Label class="text-sm font-normal">
									{roles[role]}
								</Form.Label>
							</div>
							<input hidden type="checkbox" name={attrs.name} value={role} {checked} />
						</Form.Control>
					{/each}
					<Form.FieldErrors />
				</Form.Fieldset>
				<Form.Field form={createUserForm} name="group">
					<Form.Control let:attrs>
						<Form.Label>Group</Form.Label>
						<Select.Root
							selected={selectedCreateUserGroup}
							onSelectedChange={(v) => {
								if (v) $createUserFormData.group = v.value;
							}}>
							<Select.Trigger {...attrs}>
								<Select.Value placeholder="Select a group" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value={undefined} label="None">
									<div class="mr-4 h-8 w-8 rounded-full bg-muted"></div>
									<p>None</p>
								</Select.Item>
								{#each data.groups.data as group (group.id)}
									<Select.Item
										value={group.id}
										label={group.name ?? 'Unknown'}
										class="flex items-center">
										<Avatar.Root class="mr-4 h-8 w-8">
											<Avatar.Image
												src={`${PUBLIC_API_URL}/groups/${group.id}/avatar?fallback=false`}
												alt={`Avatar of ${group.name ?? 'unknown'}`} />
											<Avatar.Fallback>{getInitial(group.name ?? '')}</Avatar.Fallback>
										</Avatar.Root>
										<p>{group.name ?? 'Unknown'}</p>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$createUserFormData.group} name={attrs.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={createUserForm} name="password">
					<Form.Control let:attrs>
						<Form.Label>Password (optional)</Form.Label>
						<Input {...attrs} type="password" bind:value={$createUserFormData.password} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={createUserForm} name="confirmPassword">
					<Form.Control let:attrs>
						<Form.Label>Confirm Password</Form.Label>
						<Input {...attrs} type="password" bind:value={$createUserFormData.confirmPassword} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="flex w-full items-center space-x-2">
					<CirclePlus />
					<p>สร้าง</p>
				</Form.Button>
			</form>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editUserDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>แก้ไขผู้ใช้</Dialog.Title>
			<Dialog.Description></Dialog.Description>
		</Dialog.Header>
		<ScrollArea class="max-h-[75vh]">
			<form
				method="POST"
				action="?/edit_user"
				enctype="multipart/form-data"
				use:editUserEnhance
				class="space-y-4 px-2">
				<Form.Field form={editUserForm} name="id">
					<Form.Control let:attrs>
						<input name={attrs.name} hidden bind:value={$editUserFormData.id} />
					</Form.Control>
				</Form.Field>
				<Form.Field form={editUserForm} name="displayName">
					<Form.Control let:attrs>
						<Form.Label>ชื่อที่จะแสดง</Form.Label>
						<Input
							{...attrs}
							bind:value={$editUserFormData.displayName}
							readonly={!isUserSuperAdmin} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={editUserForm} name="email">
					<Form.Control let:attrs>
						<Form.Label>Email</Form.Label>
						<Input {...attrs} bind:value={$editUserFormData.email} readonly={!isUserSuperAdmin} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Fieldset form={editUserForm} name="roles">
					<Form.Legend>Roles</Form.Legend>
					{#each rolesArray as role}
						{@const checked = $editUserFormData.roles.includes(role)}
						<Form.Control let:attrs>
							<div class="flex items-center space-x-2">
								<Checkbox
									{...attrs}
									{checked}
									onCheckedChange={(v) => {
										if (v) {
											$editUserFormData.roles = [...$editUserFormData.roles, role];
										} else {
											$editUserFormData.roles = $editUserFormData.roles.filter((r) => r !== role);
										}
									}} />
								<Form.Label class="text-sm font-normal">
									{roles[role]}
								</Form.Label>
							</div>
							<input hidden type="checkbox" name={attrs.name} value={role} {checked} />
						</Form.Control>
					{/each}
					<Form.FieldErrors />
				</Form.Fieldset>
				<Form.Field form={editUserForm} name="group">
					<Form.Control let:attrs>
						<Form.Label>Group</Form.Label>
						<Select.Root
							selected={selectedEditUserGroup}
							onSelectedChange={(v) => {
								if (v) $editUserFormData.group = v.value;
							}}>
							<Select.Trigger {...attrs}>
								<Select.Value placeholder="Select a group" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value={undefined} label="None">
									<div class="mr-4 h-8 w-8 rounded-full bg-muted"></div>
									<p>None</p>
								</Select.Item>
								{#each data.groups.data as group (group.id)}
									<Select.Item
										value={group.id}
										label={group.name ?? 'Unknown'}
										class="flex items-center">
										<Avatar.Root class="mr-4 h-8 w-8">
											<Avatar.Image
												src={`${PUBLIC_API_URL}/groups/${group.id}/avatar?fallback=false`}
												alt={`Avatar of ${group.name ?? 'unknown'}`} />
											<Avatar.Fallback>{getInitial(group.name ?? '')}</Avatar.Fallback>
										</Avatar.Root>
										<p>{group.name ?? 'Unknown'}</p>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$editUserFormData.group} name={attrs.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={editUserForm} name="bio">
					<Form.Control let:attrs>
						<Form.Label>Bio / status</Form.Label>
						<Input {...attrs} bind:value={$editUserFormData.bio} readonly={!isUserSuperAdmin} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={editUserForm} name="avatar">
					<Form.Control let:attrs>
						<Form.Label>Avatar</Form.Label>
						<FileInput
							{...attrs}
							bind:files={$editUserAvatar}
							accept={PUBLIC_ACCEPTED_IMAGE_TYPES}
							readonly={!isUserSuperAdmin} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={editUserForm} name="password">
					<Form.Control let:attrs>
						<Form.Label>Password (optional)</Form.Label>
						<Input
							{...attrs}
							type="password"
							bind:value={$editUserFormData.password}
							readonly={!isUserSuperAdmin} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field form={editUserForm} name="confirmPassword">
					<Form.Control let:attrs>
						<Form.Label>Confirm Password</Form.Label>
						<Input
							{...attrs}
							type="password"
							bind:value={$editUserFormData.confirmPassword}
							readonly={!isUserSuperAdmin} />
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
								<p>ลบผู้ใช้</p>
							</Button>
						</AlertDialog.Trigger>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title>ยืนยันการลบผู้ใช้ใช่หรือไม่</AlertDialog.Title>
								<AlertDialog.Description>
									ผู้ใช้จะถูกลบออกจากระบบและไม่สามารถกู้คืนได้
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
								<AlertDialog.Action
									on:click={() => {
										deleteUser($editUserFormData.id);
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
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>

<div class="mx-8 my-2">
	<div class="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
		<form
			on:submit|preventDefault={() => {
				goto(`${url.pathname}?${setSearchParams(url.search, { search, page: undefined })}`);
			}}
			class="flex w-64 flex-grow-[999] items-center">
			<Input placeholder="ค้นหาชื่อผู้ใช้" bind:value={search} class="flex-grow rounded-r-none" />
			<Button type="submit" class="rounded-l-none"><Search /></Button>
		</form>
		<DropdownMenu.Root
			onOpenChange={(open) => {
				if (!open) {
					goto(
						`${url.pathname}?${setSearchParams(url.search, { roles: checkedRoles.join(','), page: undefined })}`
					);
				}
			}}
			closeOnItemClick={false}>
			<DropdownMenu.Trigger asChild let:builder>
				<Button
					variant="outline"
					builders={[builder]}
					class="flex w-32 flex-grow items-center justify-between">
					<p class="!text-sm !font-normal">Roles</p>
					<ChevronDown class="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-48">
				<DropdownMenu.Label>เลือก Roles</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#each rolesArray as role}
					<DropdownMenu.CheckboxItem bind:checked={rolesStatus[role]}>
						{roles[role]}
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<Select.Root
			selected={selectedFilterGroup}
			onSelectedChange={(v) => {
				if (v) {
					if (v.value === 'All') {
						group = undefined;
						goto(`${url.pathname}?${setSearchParams(url.search, { group, page: undefined })}`);
					} else {
						group = v.value;
						goto(`${url.pathname}?${setSearchParams(url.search, { group, page: undefined })}`);
					}
				}
			}}>
			<Select.Trigger class="w-64 flex-grow">
				<Select.Value placeholder="Group" />
			</Select.Trigger>
			<Select.Content>
				<Select.SelectLabel>กลุ่ม / บ้าน</Select.SelectLabel>
				<Select.Item value="All" label="ทั้งหมด">
					<div class="mr-4 h-8 w-8 rounded-full bg-muted"></div>
					<p>ทั้งหมด</p>
				</Select.Item>
				{#each data.groups.data as group (group.id)}
					<Select.Item value={group.id} label={group.name ?? 'Unknown'} class="flex items-center">
						<Avatar.Root class="mr-4 h-8 w-8">
							<Avatar.Image
								src={`${PUBLIC_API_URL}/groups/${group.id}/avatar?fallback=false`}
								alt={`Avatar of ${group.name ?? 'unknown'}`} />
							<Avatar.Fallback>{getInitial(group.name ?? '')}</Avatar.Fallback>
						</Avatar.Root>
						<p>{group.name ?? 'Unknown'}</p>
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
	<div class="flex w-full flex-nowrap rounded-lg px-4 py-3">
		<div class="mr-4 flex w-0 flex-grow items-center space-x-4 lg:ml-14">
			<button
				on:click={() => {
					if (sort === 'displayName') {
						sort = '-displayName';
					} else {
						sort = 'displayName';
					}
					goto(`${url.pathname}?${setSearchParams(url.search, { sort })}`);
				}}
				class="flex w-full items-center lg:space-x-2">
				<p class="text-sm">ชื่อ</p>
				{#if sort === 'displayName'}
					<ArrowUp size={16} />
				{:else if sort === '-displayName'}
					<ArrowDown size={16} />
				{/if}
			</button>
		</div>
		<div class="flex items-center space-x-4">
			<p class="w-32 text-sm md:w-40">กลุ่ม</p>
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
				<p class="text-sm">คะแนน</p>
				{#if sort === 'totalScore'}
					<ArrowUp size={16} class="flex-shrink-0" />
				{:else if sort === '-totalScore'}
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
				class="flex w-20 items-center text-left md:w-28 lg:space-x-2">
				<p class="text-sm">ผ่านโจทย์แล้ว</p>
				{#if sort === 'problemSolvedCount'}
					<ArrowUp size={16} class="flex-shrink-0" />
				{:else if sort === '-problemSolvedCount'}
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
		{#each data.users.data as user (user.id)}
			<button
				class="w-full text-left"
				on:click={() => {
					$editUserFormData.id = user.id;
					$editUserFormData.displayName = user.displayName ?? '';
					$editUserFormData.email = user.email ?? '';
					$editUserFormData.roles = user.roles ?? [];
					$editUserFormData.group = user.group?.id ?? '';
					$editUserFormData.bio = user.bio;
					$editUserFormData.password = '';
					$editUserFormData.confirmPassword = '';
					editUserDialogOpen = true;
				}}
				disabled={!isUserSuperAdmin}>
				<User
					{user}
					class="w-full rounded-lg bg-muted px-4 py-3 transition-all hover:scale-105 hover:bg-neutral-200 dark:hover:bg-neutral-700 md:hover:scale-[1.04] lg:hover:scale-[1.03] xl:hover:scale-[1.02] 2xl:hover:scale-[1.01]" />
			</button>
		{:else}
			<p class="text-center my-4">ไม่พบผู้ใช้ที่ค้นหา</p>
		{/each}
	</div>
	<div class="mb-2 mt-4 flex items-center justify-between">
		<div class="w-64">
			<p class="!text-sm !font-normal text-muted-foreground">
				Displaying {Math.min((data.users.page - 1) * data.users.perPage + 1, data.users.total)} -
				{Math.min(data.users.page * data.users.perPage, data.users.total)} of {data.users.total}
				items
			</p>
		</div>
		<Pagination.Root
			count={data.users.total || 1}
			perPage={data.users.perPage}
			let:pages
			onPageChange={(newPage) => {
				goto(`${url.pathname}?${setSearchParams(url.search, { page: newPage })}`);
			}}
			class="mx-2 w-fit">
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
		<div class="w-64 flex-shrink-[999]"></div>
	</div>
</div>
{#if isUserAdminOrHigher}
	<Button
		on:click={() => {
			createUserDialogOpen = true;
		}}
		class="fixed bottom-4 right-4 h-16 w-16 rounded-full p-4 transition-transform hover:scale-110"
		aria-label="Create">
		<Plus size={32} />
	</Button>
{/if}
