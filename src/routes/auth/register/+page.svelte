<script lang="ts">
	import { base } from '$app/paths';

	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div
	class="mx-auto mt-8 w-96 rounded-lg bg-neutral-50 p-4 drop-shadow-lg dark:border dark:bg-background dark:drop-shadow-none"
>
	<div class="mb-4 w-full text-center">
		<h1 class="text-2xl font-bold">Register</h1>
	</div>
	<RegisterForm data={{ form: data.form }} />
	<a href="{base}/auth/login" class="mt-4 block text-center text-sm text-blue-500"
		>Already have an account? Login here</a
	>
</div>
