<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { formSchema, type FormSchema } from '$lib/schemas/create-account.schema';

	import FormMessage from '../FormMessage.svelte';

	export let data: {
		form: SuperValidated<Infer<FormSchema>>;
		token: string;
	};
	export let className: string | undefined = undefined;
	export { className as class };

	const form = superForm<Infer<typeof formSchema>>(data.form, {
		validators: zodClient(formSchema),

		applyAction: true,

		onResult({ result }) {
			if (result.type === 'redirect') {
				toast.success('Account created successfully. You can now login.');
			}
		},

		onUpdated({ form }) {
			if (form.message) {
				switch (form.message.type) {
					case 'success':
						toast.success(form.message.text);
						break;
					case 'warning':
						toast.warning(form.message.text);
						break;
					case 'error':
						toast.error(form.message.text);
						break;
				}
			}
		}
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
