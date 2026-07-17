import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { loadTeamMembersPage } from '$lib/team/queries';
import { parsePage, sanitizeSearchTerm, type PageMeta } from '$lib/pagination';
import { createClient } from '$lib/supabase/server';
import type { TeamMember } from '$lib/team/queries';

export type TeamListRole = 'trainer' | 'staff';

export type TeamListPageData = {
	forbidden: boolean;
	locale: Locale;
	d: ReturnType<typeof getDictionary>;
	listRole: TeamListRole;
	members: TeamMember[];
	meta: PageMeta;
	q: string;
	currentUserId: string;
	showCheckInHistory: boolean;
};

export async function loadTeamListPage(
	locale: Locale,
	listRole: TeamListRole,
	url: URL
): Promise<TeamListPageData> {
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace) throw redirect(303, `/${locale}/login`);

	const emptyMeta: PageMeta = {
		page: 1,
		pageSize: 25,
		total: 0,
		totalPages: 1,
		from: 0,
		to: 0
	};

	if (!canInWorkspace(workspace, 'manage_staff')) {
		return {
			forbidden: true,
			locale,
			d,
			listRole,
			members: [],
			meta: emptyMeta,
			q: '',
			currentUserId: workspace.userId,
			showCheckInHistory: false
		};
	}

	const page = parsePage(url.searchParams.get('page'));
	const q = sanitizeSearchTerm(url.searchParams.get('q') ?? '');
	const dbRole = listRole === 'trainer' ? 'TRAINER' : 'STAFF';
	const supabase = createClient();
	const { members, meta } = await loadTeamMembersPage(supabase, workspace.gymId, dbRole, {
		page,
		q
	});

	return {
		forbidden: false,
		locale,
		d,
		listRole,
		members,
		meta,
		q,
		currentUserId: workspace.userId,
		showCheckInHistory: canInWorkspace(workspace, 'checkin')
	};
}
