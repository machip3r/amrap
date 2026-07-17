import { redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { canCreatePlan, maxActivePlans } from '$lib/plans/limits';
import {
	createPlan,
	setPlanActive,
	updateDayPassPrice,
	updatePlan,
	type DayPassPriceState,
	type PlanFormState
} from '$lib/server/plans/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url, depends }) => {
	depends(OPS_LOAD_DEPS.plans);
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/login`);

	if (!canInWorkspace(workspace, 'manage_plans')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			plans: [],
			canAdd: false,
			activeCount: 0,
			maxPlans: null as number | null,
			dayPassPrice: null as number | null,
			errorKey: null as 'limit' | 'generic' | null
		};
	}

	const errorParam = url.searchParams.get('error');
	const errorKey =
		errorParam === 'limit' ? ('limit' as const) : errorParam ? ('generic' as const) : null;

	const supabase = createClient();
	const [{ data: planRows }, countsRes, { data: gymRow }] = await Promise.all([
		supabase
			.from('plans')
			.select('id, name, price, duration_days, is_active, created_at')
			.eq('gym_id', workspace.gymId)
			.order('is_active', { ascending: false })
			.order('created_at', { ascending: false }),
		supabase.rpc('plan_member_counts', { p_gym_id: workspace.gymId }),
		supabase.from('gyms').select('day_pass_price').eq('id', workspace.gymId).maybeSingle()
	]);

	const memberCounts = new Map<string, number>();
	if (countsRes.error) {
		console.error('plan_member_counts', countsRes.error.message);
		const { data: membershipRows } = await supabase
			.from('memberships')
			.select('plan_id')
			.eq('gym_id', workspace.gymId)
			.not('plan_id', 'is', null);
		for (const row of membershipRows ?? []) {
			if (!row.plan_id) continue;
			memberCounts.set(row.plan_id, (memberCounts.get(row.plan_id) ?? 0) + 1);
		}
	} else {
		for (const row of (countsRes.data ?? []) as { plan_id: string; member_count: number }[]) {
			if (!row.plan_id) continue;
			memberCounts.set(row.plan_id, Number(row.member_count) || 0);
		}
	}

	const plans = (planRows ?? []).map((p) => ({
		id: p.id,
		name: p.name,
		price: Number(p.price),
		duration_days: p.duration_days,
		is_active: p.is_active !== false,
		member_count: memberCounts.get(p.id) ?? 0
	}));

	const activeCount = plans.filter((p) => p.is_active).length;
	const maxPlans = maxActivePlans(workspace.planTier);
	const canAdd = canCreatePlan(workspace.planTier, activeCount);

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		plans,
		canAdd,
		activeCount,
		maxPlans,
		dayPassPrice: gymRow?.day_pass_price != null ? Number(gymRow.day_pass_price) : null,
		errorKey
	};
};

export const actions = {
	create: async ({ request }) => createPlan(await request.formData()) as PlanFormState,
	update: async ({ request }) => updatePlan(await request.formData()) as PlanFormState,
	setActive: async ({ request }) => {
		await setPlanActive(await request.formData());
	},
	dayPass: async ({ request }) =>
		updateDayPassPrice(await request.formData()) as DayPassPriceState
} satisfies Actions;
