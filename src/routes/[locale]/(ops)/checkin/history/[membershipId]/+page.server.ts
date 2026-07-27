import { error } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import { loadMemberCheckInsMonth } from '$lib/checkin/queries';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { createClient } from '$lib/supabase/server';
import { uuidSchema } from '$lib/validation/schemas';
import type { PageServerLoad } from './$types';

function parseMonthParam(raw: string | null): { year: number; month: number } {
	const now = new Date();
	if (!raw || !/^\d{4}-\d{2}$/.test(raw)) {
		return { year: now.getFullYear(), month: now.getMonth() + 1 };
	}
	const [y, m] = raw.split('-').map(Number);
	if (!y || !m || m < 1 || m > 12) {
		return { year: now.getFullYear(), month: now.getMonth() + 1 };
	}
	return { year: y, month: m };
}

export const load: PageServerLoad = async ({ parent, params, url, depends }) => {
	depends(OPS_LOAD_DEPS.checkin);
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);

	if (!workspace || !canInWorkspace(workspace, 'checkin')) {
		error(403, d.common.forbidden);
	}

	const id = uuidSchema.safeParse(params.membershipId);
	if (!id.success) error(404, d.entityNotFound.titleCheckin);

	const { year, month } = parseMonthParam(url.searchParams.get('month'));
	const supabase = createClient();
	const memberMonth = await loadMemberCheckInsMonth(
		supabase,
		workspace.gymId,
		id.data,
		year,
		month
	);
	if (!memberMonth) error(404, d.entityNotFound.titleCheckin);

	const canOpenMember = canInWorkspace(workspace, 'manage_members');

	return {
		locale,
		d,
		memberMonth,
		canOpenMember,
		baseHref: `/${locale}/checkin/history/${id.data}`
	};
};
