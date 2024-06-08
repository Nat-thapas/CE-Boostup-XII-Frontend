<script lang="ts">
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import FormMessage from '$lib/components/FormMessage.svelte';
	import FileInput from '$lib/components/ui/FileInput.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { Message } from '$lib/intefaces/form-message.interface';
	import type { User } from '$lib/intefaces/user.interface';
	import { formSchema, type FormSchema } from '$lib/schemas/edit-profile.schema';

	export let data: {
		form: SuperValidated<Infer<FormSchema>>;
		user: User;
	};
	export let className: string | undefined = undefined;
	export { className as class };

	const form = superForm<Infer<typeof formSchema>, Message>(data.form, {
		validators: zodClient(formSchema),

		applyAction: true,

		resetForm: false
	});

	const { form: formData, enhance, message } = form;

	$formData.displayName = data.user.displayName ?? '';
	$formData.bio = data.user.bio ?? '';
</script>

<form
	method="POST"
	action="?/edit_profile&id={data.user.id}"
	enctype="multipart/form-data"
	use:enhance
	on:submit
	class={className}
>
	<Form.Field {form} name="displayName">
		<Form.Control let:attrs>
			<Form.Label>Display Name</Form.Label>
			<Input {...attrs} bind:value={$formData.displayName} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="bio">
		<Form.Control let:attrs>
			<Form.Label>Bio / status</Form.Label>
			<Input {...attrs} bind:value={$formData.bio} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="avatar">
		<Form.Control let:attrs>
			<Form.Label>Avatar</Form.Label>
			<FileInput
				{...attrs}
				bind:files={$formData.avatar}
				accept="image/jpeg,image/png,image/svg+xml,image/gif,image/webp,image/avif"
			/>
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="oldPassword">
		<Form.Control let:attrs>
			<Form.Label>Old Password</Form.Label>
			<Input {...attrs} type="password" bind:value={$formData.oldPassword} />
		</Form.Control>
		<Form.Description>Only needed when changing password</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="password">
		<Form.Control let:attrs>
			<Form.Label>New Password</Form.Label>
			<Input {...attrs} type="password" bind:value={$formData.password} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="confirmPassword">
		<Form.Control let:attrs>
			<Form.Label>Confirm new Password</Form.Label>
			<Input {...attrs} type="password" bind:value={$formData.confirmPassword} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button class="mt-4 w-full">Save changes</Form.Button>
</form>

<FormMessage message={$message} class="mt-2" />