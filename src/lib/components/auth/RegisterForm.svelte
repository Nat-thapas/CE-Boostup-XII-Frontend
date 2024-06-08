<script lang="ts">
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { Message } from '$lib/intefaces/form-message.interface';
	import { formSchema, type FormSchema } from '$lib/schemas/register.schema';

	import FormMessage from '../FormMessage.svelte';

	export let data: {
		form: SuperValidated<Infer<FormSchema>>;
	};
	export let className: string | undefined = undefined;
	export { className as class };

	const form = superForm<Infer<typeof formSchema>, Message>(data.form, {
		validators: zodClient(formSchema),

		applyAction: true
	});

	const { form: formData, message, enhance } = form;
</script>

<form method="POST" action="?/register" use:enhance class={className}>
	<Form.Field {form} name="email">
		<Form.Control let:attrs>
			<Form.Label>Email</Form.Label>
			<Input {...attrs} bind:value={$formData.email} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button class="mt-4 w-full">Register</Form.Button>
</form>

<FormMessage message={$message} class="mt-2" />
