import { error, redirect } from '@sveltejs/kit';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import type { PageServerLoad } from './$types';

/** Legacy route — onboarding stepper replaces complete-setup. */
export const load: PageServerLoad = ({ params }) => {
	if (!isLocale(params.locale)) error(404);
	throw redirect(303, `/${params.locale as Locale}/onboarding`);
};
