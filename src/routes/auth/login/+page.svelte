<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import type { PageData } from './$types';
	import LoginForm from './LoginForm.svelte';

	export let data: PageData;

	onMount(() => {
		if (data.reason) {
			toast.warning(data.reason);
		}
	});
</script>

<div class="mx-auto w-96">
	<LoginForm data={{ form: data.form, next: data.next }} />
</div>
