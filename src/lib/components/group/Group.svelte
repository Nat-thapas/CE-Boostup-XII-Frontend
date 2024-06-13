<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';

	import * as Avatar from '$lib/components/ui/avatar';
	import { getInitial } from '$lib/get-initial';
	import type { Group } from '$lib/intefaces/group.interface';

	let className: string = '';
	export { className as class };

	export let group: Group;
</script>

<div class={className}>
	<div class="flex items-center">
		<div class="mr-4 flex w-0 flex-grow items-center">
			<Avatar.Root class="mr-4 hidden xl:block">
				<Avatar.Image
					src={`${PUBLIC_API_URL}/groups/${group.id}/avatar?fallback=false`}
					alt={`Avatar of ${group.name ?? 'unknown'}`} />
				<Avatar.Fallback>{getInitial(group.name ?? '')}</Avatar.Fallback>
			</Avatar.Root>
			<p class="w-full overflow-hidden text-ellipsis text-nowrap">{group.name}</p>
		</div>
		<div class="flex items-center space-x-4">
			<p class="hidden w-16 sm:inline md:w-20">{group.memberCount}</p>
			<p class="w-16 md:w-24">{group.totalScore}</p>
			<p class="w-16 md:w-24">{group.uniqueTotalScore}</p>
			<p class="w-16 md:w-24">{group.problemSolvedCount}</p>
			<p class="w-16 md:w-24">{group.uniqueProblemSolvedCount}</p>
			<p class="hidden w-48 lg:inline">
				{new Date(group.lastProblemSolvedAt ?? '').toLocaleString('th-TH', {
					dateStyle: 'medium',
					timeStyle: 'medium'
				})}
			</p>
		</div>
	</div>
</div>
