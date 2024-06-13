<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { base } from '$app/paths';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { formSchema, type FormSchema } from '$lib/schemas/login.schema';

	import FormMessage from '../FormMessage.svelte';

	export let data: {
		form: SuperValidated<Infer<FormSchema>>;
		next: string;
	};
	export let className: string | undefined = undefined;
	export { className as class };

	const form = superForm(data.form, {
		validators: zodClient(formSchema),

		applyAction: true,

		onResult({ result }) {
			if (result.type === 'redirect') {
				toast.success('Logged in successfully');
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

	const { form: formData, message, enhance } = form;
</script>

<form method="POST" action="?/login&next={data.next}" use:enhance class={className}>
	<Form.Field {form} name="email">
		<Form.Control let:attrs>
			<Form.Label>Email</Form.Label>
			<Input {...attrs} bind:value={$formData.email} />
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
	<a href="{base}/auth/reset" class="text-sm text-muted-foreground">Forgot password?</a>
	<Form.Button class="mt-4 w-full">Login</Form.Button>
</form>

<FormMessage message={$message} class="mt-2" />
