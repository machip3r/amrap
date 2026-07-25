import { redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { listMembershipsPage } from '$lib/members/queries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { parsePage, sanitizeSearchTerm } from '$lib/pagination';
import { createMember, type CreateMemberState } from '$lib/server/members/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

function parseStatus(raw: string | null): 'all' | 'ACTIVE' | 'EXPIRED' {
	const u = (raw ?? '').trim().toUpperCase();
	if (u === 'ACTIVE' || u === 'EXPIRED') return u;
	return 'all';
}

export const load: PageServerLoad = async ({ parent, url, depends }) => {
	depends(OPS_LOAD_DEPS.members);
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/login`);

	if (!canInWorkspace(workspace, 'manage_members')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			members: [],
			plans: [],
			activePlans: [],
			dayPassPrice: null as number | null,
			meta: { page: 1, pageSize: 25, total: 0, totalPages: 1, from: 0, to: 0 },
			filters: { q: '', status: 'all' as const, planId: 'all' },
			listError: false,
			showCheckInHistory: false
		};
	}

	const page = parsePage(url.searchParams.get('page'));
	const q = sanitizeSearchTerm(url.searchParams.get('q') ?? '');
	const status = parseStatus(url.searchParams.get('status'));
	const planId = url.searchParams.get('plan')?.trim() || 'all';
	const listError = url.searchParams.get('error') === '1';

	const supabase = createClient();
	const [{ members, meta }, { data: planRows }, { data: gymRow }] = await Promise.all([
		listMembershipsPage(supabase, workspace.gymId, {
			page,
			q,
			status,
			planId
		}),
		supabase
			.from('plans')
			.select('id, name, price, duration_days, is_active')
			.eq('gym_id', workspace.gymId)
			.order('created_at', { ascending: false }),
		supabase.from('gyms').select('day_pass_price').eq('id', workspace.gymId).maybeSingle()
	]);

	const plans = (planRows ?? []).map((p) => ({
		id: p.id,
		name: p.name,
		price: Number(p.price),
		duration_days: p.duration_days,
		is_active: p.is_active !== false
	}));
	const activePlans = plans
		.filter((p) => p.is_active)
		.map(({ id, name, price, duration_days }) => ({
			id,
			name,
			price,
			duration_days
		}));
	const dayPassPrice =
		gymRow?.day_pass_price != null ? Number(gymRow.day_pass_price) : null;

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		members,
		plans: plans.map((p) => ({ id: p.id, name: p.name })),
		activePlans,
		dayPassPrice,
		meta,
		filters: { q, status, planId },
		listError,
		showCheckInHistory: canInWorkspace(workspace, 'checkin')
	};
};

export const actions = {
	create: async ({ request }) => createMember(await request.formData()) as CreateMemberState
} satisfies Actions;
