<script lang="ts">
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { Message } from '$lib/intefaces/form-message.interface';
	import { formSchema, type FormSchema } from '$lib/schemas/create-account.schema';

	import FormMessage from '../FormMessage.svelte';

	export let data: {
		form: SuperValidated<Infer<FormSchema>>;
		token: string;
	};
	export let className: string | undefined = undefined;
	export { className as class };

	const form = superForm<Infer<typeof formSchema>, Message>(data.form, {
		validators: zodClient(formSchema),

		applyAction: true
	});

	const { form: formData, enhance, message } = form;
</script>

<form method="POST" action="?/create_account&token={data.token}" use:enhance class={className}>
	<Form.Field {form} name="displayName">
		<Form.Control let:attrs>
			<Form.Label>Display Name</Form.Label>
			<Input {...attrs} bind:value={$formData.displayName} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="password">
		<Form.Control let:attrs>
			<Form.Label>Password</Form.Label>
			<Input {...attrs} type="password" bind:value={$formData.password} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="confirmPassword">
		<Form.Control let:attrs>
			<Form.Label>Confirm Password</Form.Label>
			<Input {...attrs} type="password" bind:value={$formData.confirmPassword} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button class="mt-4 w-full">Create Account</Form.Button>
</form>

<FormMessage message={$message} class="mt-2" />
