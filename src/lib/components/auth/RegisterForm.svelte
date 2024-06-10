<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { formSchema, type FormSchema } from '$lib/schemas/register.schema';

	import FormMessage from '../FormMessage.svelte';

	export let data: {
		form: SuperValidated<Infer<FormSchema>>;
	};
	export let className: string | undefined = undefined;
	export { className as class };

	const form = superForm<Infer<typeof formSchema>>(data.form, {
		validators: zodClient(formSchema),

		applyAction: true,

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
