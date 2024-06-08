<script lang="ts">
	import { page } from '$app/stores';

	import ErrorPage from '$lib/components/ErrorPage.svelte';
</script>

<svelte:head>
	<title>{`CE Boostup XII - ${$page.status} ${$page.error?.message ?? 'Unknown error'}`}</title>
</svelte:head>

<ErrorPage status={$page.status} message={$page.error?.message} />
