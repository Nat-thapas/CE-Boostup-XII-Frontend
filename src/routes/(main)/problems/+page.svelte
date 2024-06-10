<script lang="ts">
	import { base } from '$app/paths';

	import Problem from '$lib/components/problem/Problem.svelte';
	import { Role } from '$lib/enums/role.enum';
	import { isSomeRolesIn } from '$lib/roles';

	import type { PageData } from './$types';

	export let data: PageData;

	$: includePublicationStatus = isSomeRolesIn(data.user?.roles ?? [], [
		Role.Staff,
		Role.Admin,
		Role.SuperAdmin
	]);
</script>

<div class="mx-8 my-2">
	<div class="flex w-full flex-nowrap rounded-lg px-4 py-3">
		<p class="mr-4 w-8 lg:w-12">เลขข้อ</p>
		<div class="mr-4 flex w-0 flex-grow space-x-4">
			<p class="w-full overflow-hidden text-ellipsis text-nowrap md:w-1/2">ชื่อโจทย์</p>
			<p class="hidden w-1/2 overflow-hidden text-ellipsis text-nowrap md:inline">เนื้อหา</p>
		</div>
		<div class="flex space-x-4">
			<p class="hidden w-44 overflow-hidden text-ellipsis text-nowrap xl:inline">ออกโจทย์โดย</p>
			<p class="hidden w-32 sm:flex md:w-36 lg:w-44">ความยาก</p>
			<p class="w-16 lg:w-24">คะแนน</p>
			<p class="hidden w-12 md:inline lg:w-20">ผ่านแล้ว</p>
			<p class="hidden w-20 pl-2 sm:inline xl:pl-0 xl:text-left">สถานะ</p>
			{#if includePublicationStatus}
				<p class="hidden w-24 text-right xl:inline">สถานะโจทย์</p>
			{/if}
		</div>
	</div>
	<div class="space-y-2">
		{#each data.problems.data as problem (problem.id)}
			<a href={`${base}/problems/${problem.id}`} class="block">
				<Problem
					{problem}
					{includePublicationStatus}
					class="w-full rounded-lg bg-muted px-4 py-3 transition-all hover:scale-[1.01] hover:bg-neutral-200 dark:hover:bg-neutral-700"
				/>
			</a>
		{/each}
	</div>

	<style lang="postcss">
		p {
			@apply text-nowrap text-base font-medium;
		}
	</style>
</div>
