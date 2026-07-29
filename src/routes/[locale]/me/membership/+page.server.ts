import { getMemberContext } from '$lib/auth/member-session';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { canUseOnlineBilling } from '$lib/plans/limits';
import {
	cancelMembershipAction,
	switchMemberGymAction
} from '$lib/server/member/actions';
import { loadGymPaymentAccount } from '$lib/server/payments/gateway-accounts';
import { createMercadoPagoCheckout } from '$lib/server/payments/online-checkout';
import { createClient } from '$lib/supabase/server';
import type { OrgPlanTier } from '$lib/types';
import { formString, localeSchema, uuidSchema } from '$lib/validation/schemas';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { locale, member, planTier, d } = await parent();
	const active = member.gyms.find((g) => g.gymId === member.activeGymId);
	const supabase = createClient();

	let membershipDetail: {
		id: string;
		status: string;
		expiresAt: string;
		planId: string | null;
		planName: string | null;
		planPrice: number | null;
		planDurationDays: number | null;
	} | null = null;

	let catalogPlans: {
		id: string;
		name: string;
		price: number;
		durationDays: number;
		onlineEnabled: boolean;
	}[] = [];

	let recentPayments: {
		id: string;
		amount: number;
		listAmount: number | null;
		method: string;
		kind: string;
		createdAt: string;
		planName: string | null;
	}[] = [];

	let onlinePayAvailable = false;
	let gateways: { id: 'MERCADOPAGO'; labelKey: 'gatewayMercadoPago'; available: boolean }[] = [];

	if (active) {
		const { data: mem } = await supabase
			.from('memberships')
			.select(
				'id, status, expires_at, plan_id, plans ( id, name, price, duration_days )'
			)
			.eq('id', active.membershipId)
			.eq('gym_id', active.gymId)
			.maybeSingle();

		if (mem) {
			const plan = Array.isArray(mem.plans) ? mem.plans[0] : mem.plans;
			membershipDetail = {
				id: mem.id,
				status: mem.status,
				expiresAt: mem.expires_at,
				planId: mem.plan_id,
				planName: plan?.name ?? null,
				planPrice: plan?.price != null ? Number(plan.price) : null,
				planDurationDays: plan?.duration_days ?? null
			};
		}

		const [{ data: plans }, { data: links }, { data: payments }] = await Promise.all([
			supabase
				.from('plans')
				.select('id, name, price, duration_days')
				.eq('gym_id', active.gymId)
				.eq('is_active', true)
				.order('price', { ascending: true }),
			supabase
				.from('plan_payment_links')
				.select('plan_id')
				.eq('gym_id', active.gymId)
				.eq('provider', 'MERCADOPAGO')
				.eq('is_enabled', true),
			supabase
				.from('payments')
				.select(
					'id, amount, list_amount, method, kind, created_at, plan_id, plans ( name )'
				)
				.eq('membership_id', active.membershipId)
				.eq('gym_id', active.gymId)
				.order('created_at', { ascending: false })
				.limit(20)
		]);

		const onlineIds = new Set((links ?? []).map((l) => l.plan_id));
		const mpConnected =
			canUseOnlineBilling(planTier) &&
			(await loadGymPaymentAccount(active.gymId, 'MERCADOPAGO'))?.status === 'CONNECTED';

		gateways = [
			{
				id: 'MERCADOPAGO',
				labelKey: 'gatewayMercadoPago',
				available: mpConnected
			}
		];

		catalogPlans = (plans ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			price: Number(p.price),
			durationDays: p.duration_days,
			onlineEnabled: mpConnected && onlineIds.has(p.id) && Number(p.price) > 0
		}));

		onlinePayAvailable = catalogPlans.some((p) => p.onlineEnabled);

		recentPayments = (payments ?? []).map((p) => {
			const planRow = Array.isArray(p.plans) ? p.plans[0] : p.plans;
			return {
				id: p.id,
				amount: Number(p.amount),
				listAmount: p.list_amount != null ? Number(p.list_amount) : null,
				method: p.method,
				kind: p.kind,
				createdAt: p.created_at,
				planName: planRow?.name ?? null
			};
		});
	}

	const billing = url.searchParams.get('billing');
	const billingFlash =
		billing === 'success'
			? d.member.payOnlineSuccess
			: billing === 'failure'
				? d.member.payOnlineFailure
				: billing === 'pending'
					? d.member.payOnlinePending
					: null;

	return {
		activeGym: active
			? { gymId: active.gymId, gymName: active.gymName, membershipId: active.membershipId }
			: null,
		membershipDetail,
		catalogPlans,
		recentPayments,
		onlinePayAvailable,
		gateways,
		billingFlash,
		gyms: member.gyms
	};
};

export const actions = {
	switchGym: async ({ request }) => switchMemberGymAction(await request.formData()),
	cancelMembership: async ({ request }) => cancelMembershipAction(await request.formData()),
	payOnline: async ({ request }) => {
		const formData = await request.formData();
		const localeRaw = formString(formData, 'locale') || 'es';
		const localeParsed = localeSchema.safeParse(localeRaw);
		const locale = (localeParsed.success ? localeParsed.data : 'es') as Locale;
		const d = getDictionary(locale);

		const member = await getMemberContext();
		if (!member) return { error: d.common.forbidden, intent: 'payOnline' as const };

		const active = member.gyms.find((g) => g.gymId === member.activeGymId);
		if (!active) return { error: d.common.forbidden, intent: 'payOnline' as const };

		const planId = uuidSchema.safeParse(formString(formData, 'plan_id'));
		if (!planId.success) return { error: d.common.invalidInput, intent: 'payOnline' as const };

		const supabase = createClient();
		const { data: person } = await supabase
			.from('persons')
			.select('email')
			.eq('id', member.personId)
			.maybeSingle();

		const { data: org } = await supabase
			.from('gyms')
			.select('organizations ( plan_tier )')
			.eq('id', active.gymId)
			.maybeSingle();
		const orgRow = Array.isArray(org?.organizations)
			? org?.organizations[0]
			: org?.organizations;
		const tier = ((orgRow?.plan_tier as OrgPlanTier | undefined) ?? 'FREEMIUM') as OrgPlanTier;
		if (!canUseOnlineBilling(tier)) {
			return { error: d.member.payOnlineUnavailable, intent: 'payOnline' as const };
		}

		const checkout = await createMercadoPagoCheckout({
			locale,
			gymId: active.gymId,
			membershipId: active.membershipId,
			planId: planId.data,
			createdBy: member.userId,
			payerEmail: person?.email ?? null,
			returnPath: `/${locale}/me/membership`
		});

		if (!checkout.ok) {
			return {
				error: checkout.message || d.settings.gatewayCheckoutError,
				intent: 'payOnline' as const
			};
		}

		throw redirect(303, checkout.initPoint);
	}
} satisfies Actions;
