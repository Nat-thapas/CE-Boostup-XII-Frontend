<script lang="ts">
	import Moon from 'lucide-svelte/icons/moon';
	import Sun from 'lucide-svelte/icons/sun';
	import { toggleMode } from 'mode-watcher';

	import logo_64x64 from '$lib/assets/logo/logo-64x64.avif';
	import Breadcrumb from '$lib/components/nav/Breadcrumb.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import EditProfile from '$lib/components/user/EditProfile.svelte';
	import { getInitial } from '$lib/get-initial';

	import type { LayoutData } from './$types';

	export let data: LayoutData;

	let editProfileSheetOpen = false;
</script>

<nav class="flex w-full items-center justify-between px-16 py-2">
	<div class="flex items-center space-x-2">
		<img src={logo_64x64} alt="CE Boostup XII logo" class="h-10 w-10" />
		<Breadcrumb />
	</div>
	<div class="flex items-center space-x-4">
		<Button on:click={toggleMode} variant="outline" size="icon">
			<Sun
				class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
			/>
			<Moon
				class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
			/>
			<span class="sr-only">Toggle theme</span>
		</Button>
		<button
			on:click={() => {
				editProfileSheetOpen = true;
			}}
		>
			<Avatar.Root>
				<Avatar.Image src={data.user.avatarUrl} alt={`Avatar of ${data.user.displayName}`} />
				<Avatar.Fallback>{getInitial(data.user.displayName ?? '')}</Avatar.Fallback>
			</Avatar.Root>
		</button>
	</div>
</nav>

<EditProfile
	bind:open={editProfileSheetOpen}
	bind:form={data.editProfileForm}
	bind:user={data.user}
/>

<Separator />

<slot />
