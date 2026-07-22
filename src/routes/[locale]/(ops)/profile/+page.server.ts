import { redirect } from '@sveltejs/kit';
import { canComposeFeedback, submitFeedbackAction, type FeedbackFormState } from '$lib/server/feedback/actions';
import { getDictionary } from '$lib/i18n/dictionaries';
import type { Locale } from '$lib/i18n/config';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { locale, workspace, documentBrand } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/login`);

	const canCompose = await canComposeFeedback();

	return {
		locale: locale as Locale,
		d,
		documentBrand: documentBrand ?? null,
		gymName: workspace.gymName,
		fullName: workspace.fullName,
		canCompose,
		canActAsOwner: workspace.canActAsOwner
	};
};

export const actions = {
	feedback: async ({ request }) =>
		submitFeedbackAction(await request.formData()) as FeedbackFormState
} satisfies Actions;
