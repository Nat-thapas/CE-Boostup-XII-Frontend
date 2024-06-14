<script lang="ts">
	import Moon from 'lucide-svelte/icons/moon';
	import Sun from 'lucide-svelte/icons/sun';
	import { toggleMode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { PUBLIC_API_URL } from '$env/static/public';

	import logo_64x64 from '$lib/assets/logo/logo-64x64.avif';
	import Breadcrumb from '$lib/components/nav/Breadcrumb.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Separator } from '$lib/components/ui/separator';
	import EditProfile from '$lib/components/user/EditProfile.svelte';
	import { getInitial } from '$lib/get-initial';

	import type { LayoutData } from './$types';

	export let data: LayoutData;

	let editProfileSheetOpen = false;

	function logout(): void {
		fetch(`${base}/auth/logout`, { method: 'POST' }).then(() => {
			toast.success('Logged out successfully');
			goto(`${base}/auth/login`);
		});
	}
</script>

<nav class="flex w-full items-center justify-between px-16 py-2">
	<div class="flex items-center space-x-2">
		<img src={logo_64x64} alt="CE Boostup XII logo" class="h-10 w-10" />
		<Breadcrumb token={data.token} />
	</div>
	<div class="flex items-center space-x-4">
		<Button on:click={toggleMode} variant="outline" size="icon">
			<Sun
				class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon
				class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span class="sr-only">Toggle theme</span>
		</Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Avatar.Root>
					<Avatar.Image
						src={`${PUBLIC_API_URL}/users/${data.user.id}/avatar?fallback=false`}
						alt={`Avatar of ${data.user.displayName}`} />
					<Avatar.Fallback>{getInitial(data.user.displayName ?? '')}</Avatar.Fallback>
				</Avatar.Root>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.Label>My Account</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						on:click={() => {
							editProfileSheetOpen = true;
						}}
						class="cursor-pointer">
						Profile
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={logout} class="cursor-pointer">Logout</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</nav>

<EditProfile
	bind:open={editProfileSheetOpen}
	bind:form={data.editProfileForm}
	bind:user={data.user} />

<Separator />

<slot />
