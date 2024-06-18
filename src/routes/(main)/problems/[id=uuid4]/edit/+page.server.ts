import { error, type Actions } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { PRIVATE_API_URL } from '$env/static/private';

import { assignDefined } from '$lib/assign-defined';
import { PublicationStatus } from '$lib/enums/publication-status.enum';
import { Role } from '$lib/enums/role.enum';
import type { PaginatedResponse } from '$lib/intefaces/pagination.interface';
import type { ProblemTag } from '$lib/intefaces/problem-tag.interface';
import type { Problem } from '$lib/intefaces/problem.interface';
import { isSomeRolesIn } from '$lib/roles';
import { formSchema } from '$lib/schemas/edit-problem.schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const problemResponsePromise = fetch(`${PRIVATE_API_URL}/problems/${params.id}`, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${locals.token}`
		}
	});

	const problemTagsResponsePromise = fetch(
		`${PRIVATE_API_URL}/problem-tags?` +
			new URLSearchParams({
				sort: 'name',
				perPage: '1000'
			}),
		{
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${locals.token}`
			}
		}
	);

	const problemResponse = await problemResponsePromise;

	if (!problemResponse.ok) {
		error(404, 'Problem not found');
	}

	const problem = (await problemResponse.json()) as Problem;

	if (
		problem.owner?.id !== locals.user.id &&
		!isSomeRolesIn(locals.user.roles ?? [], [Role.Reviewer, Role.Admin, Role.SuperAdmin])
	) {
		error(403, 'You are not allowed to edit this problem');
	}

	const problemTagsResponse = await problemTagsResponsePromise;
	if (!problemTagsResponse.ok) {
		console.error(problemTagsResponse);
		error(500, 'Failed to fetch problem tags');
	}

	return {
		editProblemForm: await superValidate(zod(formSchema)),
		problem,
		problemTags: (await problemTagsResponse.json()) as PaginatedResponse<ProblemTag>
	};
};

export const actions: Actions = {
	edit_problem: async (event) => {
		const form = await superValidate(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const id = event.url.searchParams.get('id');

		const currentProblemResponse = await fetch(`${PRIVATE_API_URL}/problems/${id}`, {
			headers: {
				Authorization: `Bearer ${event.locals.token}`
			}
		});

		const currentProblem = await currentProblemResponse.json();

		if (!currentProblemResponse.ok) {
			return message(
				form,
				{
					type: 'error',
					text: 'Cannot fetch current problem data'
				},
				{
					status: 500
				}
			);
		}

		const currentPublicationStatus = currentProblem.publicationStatus;
		const problemOwner = currentProblem.owner.id;

		if (
			currentPublicationStatus === PublicationStatus.Draft &&
			(problemOwner === event.locals.user.id ||
				isSomeRolesIn(event.locals.user.roles ?? [], [Role.SuperAdmin]))
		) {
			const body: Record<string, any> = {};

			assignDefined(body, {
				title: form.data.title,
				description: form.data.description,
				input: form.data.input,
				output: form.data.output,
				hint: form.data.hint,
				hintCost: form.data.hintCost,
				testcases: form.data.testcases,
				exampleTestcases: form.data.exampleTestcases,
				starterCode: form.data.starterCode,
				solution: form.data.solution,
				solutionLanguage: form.data.solutionLanguage,
				allowedHeaders: form.data.allowAllHeaders ? null : form.data.allowedHeaders,
				bannedFunctions: form.data.bannedFunctions,
				timeLimit: form.data.timeLimit,
				memoryLimit: form.data.memoryLimit,
				difficulty: form.data.difficulty,
				score: form.data.score,
				optimizationLevel: form.data.optimizationLevel,
				tags: form.data.tags,
				credits: form.data.credits,
				attachments: form.data.oldAttachments
					? form.data.oldAttachments.map((attachment) => attachment.id)
					: undefined
			});

			if (form.data.attachments) {
				if (!body.attachments) {
					body.attachments = [];
				}

				if (!form.data.oldAttachments) {
					form.data.oldAttachments = [];
				}

				for (const [i, attachment] of Object.entries(form.data.attachments)) {
					const formData = new FormData();
					formData.append('file', attachment);
					const response = await fetch(`${PRIVATE_API_URL}/attachments`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${event.locals.token}`
						},
						body: formData
					});

					const data = await response.json();

					if (!response.ok) {
						form.errors.attachments = {
							[parseInt(i)]: [
								data.message instanceof Array ? data.message.join(', ') : data.message
							]
						};
						return fail(400, {
							form
						});
					}

					form.data.oldAttachments?.push(data);
					body.attachments.push(data.id);
				}

				form.data.attachments = undefined;
			}

			const response = await fetch(`${PRIVATE_API_URL}/problems/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${event.locals.token}`
				},
				body: JSON.stringify(body)
			});

			const data = await response.json();

			if (!response.ok) {
				let errorMessage: string | string[] | undefined;
				if (data.errors) {
					for (const key in data.errors) {
						switch (key) {
							case 'title':
								form.errors.title = [data.errors.title];
								break;
							case 'description':
								form.errors.description = [data.errors.description];
								break;
							case 'input':
								form.errors.input = [data.errors.input];
								break;
							case 'output':
								form.errors.output = [data.errors.output];
								break;
							case 'hint':
								form.errors.hint = [data.errors.hint];
								break;
							case 'hintCost':
								form.errors.hintCost = [data.errors.hintCost];
								break;
							case 'starterCode':
								form.errors.starterCode = [data.errors.starterCode];
								break;
							case 'solution':
								form.errors.solution = [data.errors.solution];
								break;
							case 'solutionLanguage':
								form.errors.solutionLanguage = [data.errors.solutionLanguage];
								break;
							case 'timeLimit':
								form.errors.timeLimit = [data.errors.timeLimit];
								break;
							case 'memoryLimit':
								form.errors.memoryLimit = [data.errors.memoryLimit];
								break;
							case 'difficulty':
								form.errors.difficulty = [data.errors.difficulty];
								break;
							case 'score':
								form.errors.score = [data.errors.score];
								break;
							case 'optimizationLevel':
								form.errors.optimizationLevel = [data.errors.optimizationLevel];
								break;
							case 'credits':
								form.errors.credits = [data.errors.credits];
								break;
							case 'testcase':
								switch (data.errors.testcase.type) {
									case 'testcase': {
										const error: Record<number, Record<string, string[]>> = {};
										error[parseInt(data.errors.testcase.index)] = { output: ['Incorrect output'] };
										form.errors.testcases = error;
										break;
									}
									case 'example': {
										const error: Record<number, Record<string, string[]>> = {};
										error[parseInt(data.errors.testcase.index)] = { output: ['Incorrect output'] };
										form.errors.exampleTestcases = error;
										break;
									}
								}
								break;
							default:
								errorMessage = data.message;
								break;
						}
					}
				} else {
					errorMessage = data.message;
				}

				if (errorMessage) {
					errorMessage = errorMessage instanceof Array ? errorMessage.join(', ') : errorMessage;
					return message(
						form,
						{
							type: 'error',
							text: errorMessage
						},
						{
							status: 400
						}
					);
				} else {
					return fail(400, {
						form
					});
				}
			}
		}

		if (form.data.publicationStatus && form.data.publicationStatus !== currentPublicationStatus) {
			const body: Record<string, string> = {
				publicationStatus: form.data.publicationStatus
			};

			if (form.data.reviewComment && problemOwner !== event.locals.user.id) {
				body.reviewComment = form.data.reviewComment;
			}

			const response = await fetch(`${PRIVATE_API_URL}/problems/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${event.locals.token}`
				},
				body: JSON.stringify(body)
			});

			const data = await response.json();

			if (!response.ok) {
				let errorMessage: string | string[] | undefined;
				if (data.errors) {
					for (const key in data.errors) {
						switch (key) {
							case 'title':
								form.errors.title = [data.errors.title];
								break;
							case 'description':
								form.errors.description = [data.errors.description];
								break;
							case 'input':
								form.errors.input = [data.errors.input];
								break;
							case 'output':
								form.errors.output = [data.errors.output];
								break;
							case 'hint':
								form.errors.hint = [data.errors.hint];
								break;
							case 'hintCost':
								form.errors.hintCost = [data.errors.hintCost];
								break;
							case 'starterCode':
								form.errors.starterCode = [data.errors.starterCode];
								break;
							case 'solution':
								form.errors.solution = [data.errors.solution];
								break;
							case 'solutionLanguage':
								form.errors.solutionLanguage = [data.errors.solutionLanguage];
								break;
							case 'timeLimit':
								form.errors.timeLimit = [data.errors.timeLimit];
								break;
							case 'memoryLimit':
								form.errors.memoryLimit = [data.errors.memoryLimit];
								break;
							case 'difficulty':
								form.errors.difficulty = [data.errors.difficulty];
								break;
							case 'score':
								form.errors.score = [data.errors.score];
								break;
							case 'optimizationLevel':
								form.errors.optimizationLevel = [data.errors.optimizationLevel];
								break;
							case 'credits':
								form.errors.credits = [data.errors.credits];
								break;
							case 'testcase':
								switch (data.errors.testcase.type) {
									case 'testcase': {
										const error: Record<number, Record<string, string[]>> = {};
										error[parseInt(data.errors.testcase.index)] = { output: ['Incorrect output'] };
										form.errors.testcases = error;
										break;
									}
									case 'example': {
										const error: Record<number, Record<string, string[]>> = {};
										error[parseInt(data.errors.testcase.index)] = { output: ['Incorrect output'] };
										form.errors.exampleTestcases = error;
										break;
									}
								}
								break;
							default:
								errorMessage = data.message;
								break;
						}
					}
				} else {
					errorMessage = data.message;
				}

				if (errorMessage) {
					errorMessage = errorMessage instanceof Array ? errorMessage.join(', ') : errorMessage;
					return message(
						form,
						{
							type: 'error',
							text: errorMessage
						},
						{
							status: 400
						}
					);
				} else {
					return fail(400, {
						form
					});
				}
			}

			if (
				currentPublicationStatus === PublicationStatus.Draft &&
				data.publicationStatus === PublicationStatus.AwaitingApproval
			) {
				form.data.reviewComment = undefined;
			}
		}

		if (
			problemOwner === event.locals.user.id ||
			isSomeRolesIn(event.locals.user.roles ?? [], [Role.SuperAdmin])
		) {
			return message(form, {
				type: 'success',
				text: 'Problem updated successfully!'
			});
		} else {
			return message(form, {
				type: 'success',
				text: 'Problem status updated successfully!'
			});
		}
	}
};
