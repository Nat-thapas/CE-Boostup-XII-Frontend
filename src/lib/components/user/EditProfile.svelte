<script lang="ts">
	import type { Infer, SuperValidated } from 'sveltekit-superforms';

	import * as Sheet from '$lib/components/ui/sheet';
	import type { User } from '$lib/intefaces/user.interface';
	import type { FormSchema } from '$lib/schemas/edit-profile.schema';

	import EditProfileForm from './EditProfileForm.svelte';

	export let open: boolean;
	export let form: SuperValidated<Infer<FormSchema>>;
	export let user: User;

	// eslint-disable-next-line no-undef
	function handleMessage(event: CustomEvent<App.Superforms.Message>): void {
		if (event.detail?.type === 'success') {
			open = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right">
		<Sheet.Header>
			<Sheet.Title>Edit profile</Sheet.Title>
			<Sheet.Description>
				Make changes to your profile here. Click save when you're done.
			</Sheet.Description>
		</Sheet.Header>
		<div style="height: calc(100vh - 132px);" class="mt-4 overflow-y-auto px-1">
			<EditProfileForm data={{ form, user }} on:message={handleMessage} />
		</div>
	</Sheet.Content>
</Sheet.Root>
