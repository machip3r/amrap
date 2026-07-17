import { redirect } from '@sveltejs/kit';
import { negotiateLocale } from '$lib/i18n/negotiate-locale';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ request }) => {
	const locale = negotiateLocale(request.headers.get('accept-language'));
	redirect(302, `/${locale}`);
};
