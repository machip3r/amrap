import type { Locale } from '$lib/i18n/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ params }) => {
	return { locale: params.locale as Locale };
};
