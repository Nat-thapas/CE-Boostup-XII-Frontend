<script lang="ts">
	import Rating from '$lib/components/ui/Rating.svelte';
	import { CompletionStatus } from '$lib/enums/completion-status.enum';
	import { PublicationStatus } from '$lib/enums/publication-status.enum';
	import type { Problem } from '$lib/intefaces/problem.interface';

	let className: string = '';
	export { className as class };

	export let problem: Problem;
	export let includePublicationStatus: boolean = false;

	$: tags = problem.tags?.map((tag) => tag.name).join(', ');

	$: completionStatus = problem.completionStatus
		? {
				[CompletionStatus.Attempted]: 'ลองทำแล้ว',
				[CompletionStatus.Unattempted]: 'ยังไม่ได้ทำ',
				[CompletionStatus.Solved]: 'ผ่านแล้ว'
			}[problem.completionStatus]
		: 'ไม่ทราบ';

	$: publicationStatus = problem.publicationStatus
		? {
				[PublicationStatus.Draft]: 'ร่าง',
				[PublicationStatus.AwaitingApproval]: 'รอการอนุมัติ',
				[PublicationStatus.Approved]: 'อนุมัติแล้ว',
				[PublicationStatus.Rejected]: 'ปฏิเสธ',
				[PublicationStatus.Published]: 'เผยแพร่แล้ว',
				[PublicationStatus.Archived]: 'เก็บถาวร'
			}[problem.publicationStatus]
		: 'ไม่ทราบ';
</script>

<div class={className}>
	<div class="flex">
		<p class="mr-4 w-8 lg:w-12">{problem.number}</p>
		<div class="mr-4 flex w-0 flex-grow space-x-4">
			<p class="w-full overflow-hidden text-ellipsis text-nowrap md:w-1/2">{problem.title}</p>
			<p class="hidden w-1/2 overflow-hidden text-ellipsis text-nowrap md:inline">{tags}</p>
		</div>
		<div class="flex space-x-4">
			<p class="hidden w-44 overflow-hidden text-ellipsis text-nowrap xl:inline">
				{problem.owner?.displayName}
			</p>
			<Rating value={problem.difficulty ?? 0} class="hidden w-32 sm:flex md:w-36 lg:w-44" />
			<p class="w-16 lg:w-24">{problem.score}</p>
			<p class="hidden w-12 md:inline lg:w-20">{problem.userSolvedCount}</p>
			<p
				class="hidden w-20 text-right sm:inline xl:text-left"
				class:attempted={problem.completionStatus === CompletionStatus.Attempted}
				class:unattempted={problem.completionStatus === CompletionStatus.Unattempted}
				class:solved={problem.completionStatus === CompletionStatus.Solved}
			>
				{completionStatus}
			</p>
			{#if includePublicationStatus}
				<p
					class="hidden w-24 text-right xl:inline"
					class:draft={problem.publicationStatus === PublicationStatus.Draft}
					class:awaiting-approval={problem.publicationStatus === PublicationStatus.AwaitingApproval}
					class:approved={problem.publicationStatus === PublicationStatus.Approved}
					class:rejected={problem.publicationStatus === PublicationStatus.Rejected}
					class:published={problem.publicationStatus === PublicationStatus.Published}
					class:archived={problem.publicationStatus === PublicationStatus.Archived}
				>
					{publicationStatus}
				</p>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	p {
		@apply text-nowrap text-base font-medium;
	}
	.attempted {
		@apply text-yellow-500;
	}
	.unattempted {
		@apply text-muted-foreground;
	}
	.solved {
		@apply text-green-500;
	}
	.draft {
		@apply text-muted-foreground;
	}
	.awaiting-approval {
		@apply text-yellow-500;
	}
	.approved {
		@apply text-sky-500;
	}
	.rejected {
		@apply text-red-500;
	}
	.published {
		@apply text-green-500;
	}
	.archived {
		@apply text-muted-foreground;
	}
</style>
