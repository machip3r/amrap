import { submitFeedbackAction, type FeedbackFormState } from '$lib/server/feedback/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const data = await parent();
	return {
		locale: data.locale,
		d: data.d,
		member: data.member,
		gymName: data.gymName,
		documentBrand: data.documentBrand,
		qrCode: data.qrCode
	};
};

export const actions = {
	feedback: async ({ request }) =>
		submitFeedbackAction(await request.formData()) as FeedbackFormState
} satisfies Actions;
