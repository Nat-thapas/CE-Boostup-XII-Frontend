<script lang="ts">
	import CreateAccountForm from '$lib/components/auth/CreateAccountForm.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>CE Boostup XII - Create Account</title>
</svelte:head>

<div
	class="mx-auto mt-8 w-96 rounded-lg bg-neutral-50 p-4 drop-shadow-lg dark:border dark:bg-background dark:drop-shadow-none">
	<div class="mb-4 w-full text-center">
		<h1 class="text-2xl font-bold">Create Account</h1>
	</div>
	<CreateAccountForm data={{ form: data.form, token: data.token ?? '' }} />
</div>
