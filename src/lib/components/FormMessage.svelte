<script lang="ts">
	export let className: string = '';
	export { className as class };
	// eslint-disable-next-line no-undef
	export let message: App.Superforms.Message | undefined = undefined;
</script>

<div class={className}>
	{#if message}
		{#if message.type === 'success'}
			<div class="text-sm font-medium text-green-500">{message.text}</div>
		{:else if message.type === 'warning'}
			<div class="text-sm font-medium text-yellow-500">{message.text}</div>
		{:else if message.type === 'error'}
			<div class="text-sm font-medium text-destructive">{message.text}</div>
		{/if}
	{/if}
</div>
