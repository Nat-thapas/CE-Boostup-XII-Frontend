<script lang="ts">
	import ResetPasswordForm from '$lib/components/auth/ResetPasswordForm.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>CE Boostup XII - Reset Password</title>
</svelte:head>

<div
	class="mx-auto mt-8 w-96 rounded-lg bg-neutral-50 p-4 drop-shadow-lg dark:border dark:bg-background dark:drop-shadow-none">
	<div class="mb-4 w-full text-center">
		<h1 class="text-2xl font-bold">Reset Password</h1>
	</div>
	<ResetPasswordForm data={{ form: data.form, token: data.token ?? '' }} />
</div>
