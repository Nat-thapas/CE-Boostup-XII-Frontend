<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { base } from '$app/paths';

	import LoginForm from '$lib/components/auth/LoginForm.svelte';

	import type { PageData } from './$types';

	export let data: PageData;

	onMount(() => {
		if (data.reason) {
			toast.warning(data.reason);
		}
	});
</script>

<div
	class="mx-auto mt-8 w-96 rounded-lg bg-neutral-50 p-4 drop-shadow-lg dark:border dark:bg-background dark:drop-shadow-none"
>
	<div class="mb-4 w-full text-center">
		<h1 class="text-2xl font-bold">Login</h1>
	</div>
	<LoginForm data={{ form: data.form, next: data.next }} />
	<a href="{base}/auth/register" class="mt-4 block text-center text-sm text-blue-500"
		>Don't have an account? Register here</a
	>
</div>
