import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import {
	amountSchema,
	formString,
	localeSchema,
	paymentMethodSchema,
	uuidSchema
} from '$lib/validation/schemas';
import { zodFieldErrors } from '$lib/validation/field-errors';
import {
	toDbMemberStatus,
	toDbPaymentKind,
	toDbPaymentMethod
} from '$lib/validation/db-enums';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	computeRenewedExpiry,
	memberStatusFromExpires
} from '$lib/members/dates';
import { createClient } from '$lib/supabase/server';
import { z } from 'zod';

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

const createPaymentSchema = z
	.object({
		locale: localeSchema,
		member_id: uuidSchema,
		amount: amountSchema,
		method: paymentMethodSchema,
		kind: z.enum(['plan', 'day_pass']),
		plan_id: z.string().optional()
	})
	.superRefine((data, ctx) => {
		if (data.kind === 'plan') {
			const id = uuidSchema.safeParse(data.plan_id);
			if (!id.success) {
				ctx.addIssue({
					code: 'custom',
					message: 'invalid',
					path: ['plan_id']
				});
			}
		}
	});

export type CreatePaymentState = {
	error?: string;
	fieldErrors?: Record<string, string>;
	success?: boolean;
	paymentId?: string;
} | null;

export async function createPayment(formData: FormData): Promise<CreatePaymentState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'record_payment')) {
		return { error: d.common.forbidden };
	}

	const parsed = createPaymentSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		member_id: formString(formData, 'member_id'),
		amount: formString(formData, 'amount'),
		method: formString(formData, 'method') || 'cash',
		kind: formString(formData, 'kind') || 'plan',
		plan_id: formString(formData, 'plan_id') || undefined
	});
	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}

	const supabase = createClient();

	const { data: membership, error: memErr } = await supabase
		.from('memberships')
		.select('id, expires_at, plan_id')
		.eq('id', parsed.data.member_id)
		.eq('gym_id', workspace.gymId)
		.maybeSingle();

	if (memErr || !membership) {
		return { fieldErrors: { member_id: d.validation.invalid } };
	}

	let durationDays = 1;
	let nextPlanId: string | null = membership.plan_id;
	let paymentPlanId: string | null = null;
	const paymentKind = parsed.data.kind;

	if (parsed.data.kind === 'plan') {
		const planId = parsed.data.plan_id!;
		const { data: plan, error: planErr } = await supabase
			.from('plans')
			.select('id, price, duration_days, is_active')
			.eq('id', planId)
			.eq('gym_id', workspace.gymId)
			.eq('is_active', true)
			.maybeSingle();

		if (planErr || !plan) {
			return { fieldErrors: { plan_id: d.validation.invalid } };
		}
		durationDays = plan.duration_days;
		nextPlanId = plan.id;
		paymentPlanId = plan.id;
	} else {
		const { data: gym, error: gymErr } = await supabase
			.from('gyms')
			.select('day_pass_price')
			.eq('id', workspace.gymId)
			.maybeSingle();

		if (gymErr || gym?.day_pass_price == null) {
			return { error: d.payments.dayPassNotConfigured };
		}
		durationDays = 1;
	}

	const newExpires = computeRenewedExpiry(
		new Date(membership.expires_at),
		durationDays
	);
	const status = toDbMemberStatus(memberStatusFromExpires(newExpires));

	const { data: inserted, error } = await supabase
		.from('payments')
		.insert({
			gym_id: workspace.gymId,
			membership_id: membership.id,
			amount: parsed.data.amount,
			method: toDbPaymentMethod(parsed.data.method),
			kind: toDbPaymentKind(paymentKind),
			plan_id: paymentPlanId,
			recorded_by: workspace.userId
		})
		.select('id')
		.single();

	if (error || !inserted) {
		console.error('createPayment', error?.message);
		return { error: d.payments.error };
	}

	const { error: updErr } = await supabase
		.from('memberships')
		.update({
			expires_at: newExpires.toISOString(),
			status,
			plan_id: nextPlanId
		})
		.eq('id', membership.id)
		.eq('gym_id', workspace.gymId);

	if (updErr) {
		console.error('createPayment membership', updErr.message);
		return { error: d.payments.error };
	}

	return { success: true, paymentId: inserted.id };
}
