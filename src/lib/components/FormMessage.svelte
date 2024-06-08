<script lang="ts">
	import type { Message } from '$lib/intefaces/form-message.interface';

	export let className: string = '';
	export { className as class };
	export let message: Message | undefined = undefined;
</script>

<div class={className}>
	{#if message}
		{#if message.status === 'success'}
			<div class="text-green-500">{message.message}</div>
		{:else if message.status === 'warning'}
			<div class="text-yellow-500">{message.message}</div>
		{:else if message.status === 'error'}
			<div class="text-red-500">{message.message}</div>
		{/if}
	{/if}
</div>
