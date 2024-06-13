<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';

	import * as Avatar from '$lib/components/ui/avatar';
	import { getInitial } from '$lib/get-initial';
	import type { User } from '$lib/intefaces/user.interface';

	let className: string = '';
	export { className as class };

	export let user: User;
</script>

<div class={className}>
	<div class="flex items-center">
		<div class="mr-4 flex w-0 flex-grow items-center">
			<Avatar.Root class="mr-4 hidden lg:block">
				<Avatar.Image
					src={`${PUBLIC_API_URL}/users/${user.id}/avatar?fallback=false`}
					alt={`Avatar of ${user.displayName ?? 'unknown'}`} />
				<Avatar.Fallback>{getInitial(user.displayName ?? '')}</Avatar.Fallback>
			</Avatar.Root>
			<p class="w-full overflow-hidden text-ellipsis text-nowrap">{user.displayName}</p>
		</div>
		<div class="flex items-center space-x-4">
			<p class="w-32 overflow-hidden text-ellipsis text-nowrap md:w-40">
				{user.group?.name ?? 'No group'}
			</p>
			<p class="w-16 md:w-24">{user.totalScore}</p>
			<p class="w-20 md:w-28">{user.problemSolvedCount}</p>
			<p class="hidden w-48 lg:inline">
				{new Date(user.lastProblemSolvedAt ?? '').toLocaleString('th-TH', {
					dateStyle: 'medium',
					timeStyle: 'medium'
				})}
			</p>
		</div>
	</div>
</div>
