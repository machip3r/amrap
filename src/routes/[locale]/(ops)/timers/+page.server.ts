import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { locale, d } = await parent();
	const workspace = await getWorkspace();
	if (!workspace) throw redirect(303, `/${locale}/login`);

	if (!canInWorkspace(workspace, 'use_timers')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d
		};
	}

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d
	};
};
