import { getLandingDictionary } from '$lib/i18n/landing-dictionaries';
import type { Locale } from '$lib/i18n/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const locale = params.locale as Locale;
	const d = getLandingDictionary(locale);
	return { d, meta: d.meta, locale };
};
