import { redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import type { PageServerLoad } from './$types';

type InviteRole = 'trainer' | 'staff';

function parseRole(raw: string | null): InviteRole | null {
	if (raw === 'trainer' || raw === 'staff') return raw;
	return null;
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { locale, workspace } = await parent();
	if (!workspace) throw redirect(303, `/${locale}/login`);
	if (!canInWorkspace(workspace, 'manage_staff')) {
		throw redirect(303, `/${locale}/dashboard`);
	}

	const d = getDictionary(locale as Locale);
	const invite = parseRole(url.searchParams.get('invite'));

	return {
		locale: locale as Locale,
		d,
		invite
	};
};
