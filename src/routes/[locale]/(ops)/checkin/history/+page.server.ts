import { error } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import { listCheckInsPage } from '$lib/checkin/queries';
import { parsePage } from '$lib/pagination';
import { createClient } from '$lib/supabase/server';
import { isoDateSchema } from '$lib/validation/schemas';
import type { PageServerLoad } from './$types';

function parseOptionalDate(raw: string | undefined): string | null {
	if (!raw) return null;
	const parsed = isoDateSchema.safeParse(raw);
	return parsed.success ? parsed.data : null;
}

function todayIsoDate() {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { locale, d, workspace } = await parent();

	if (!canInWorkspace(workspace, 'checkin')) {
		error(403, d.common.forbidden);
	}

	const supabase = createClient();
	const page = parsePage(url.searchParams.get('page'));
	const today = todayIsoDate();
	const date = parseOptionalDate(url.searchParams.get('date') ?? undefined) ?? today;
	const canManageMembers = canInWorkspace(workspace, 'manage_members');

	const { items, meta } = await listCheckInsPage(supabase, workspace.gymId, {
		page,
		date
	});

	return {
		locale,
		d,
		items,
		meta,
		date,
		today,
		canManageMembers
	};
};
