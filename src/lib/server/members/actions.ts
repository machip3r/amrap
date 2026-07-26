import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import {
	memberStatusFromExpires,
	computeRenewedExpiry,
	computeNewMembershipExpiry
} from '$lib/members/dates';
import {
	emailSchema,
	formString,
	localeSchema,
	optionalPhoneSchema,
	paymentMethodSchema,
	personNameSchema,
	uuidSchema
} from '$lib/validation/schemas';
import { zodFieldErrors } from '$lib/validation/field-errors';
import { getDictionary } from '$lib/i18n/dictionaries';
import { isDayPassPlanValue } from '$lib/members/day-pass';
import { parseDeskPricing } from '$lib/payments/pricing';
import {
	isHardMemberCap,
	maxActiveMembers
} from '$lib/plans/limits';
import { createClient } from '$lib/supabase/server';
import { personUniqueFieldFromError, isAlreadyMemberAtGymError } from '$lib/supabase/errors';
import { inviteAuthUserByEmail, linkPersonToUser } from '$lib/team/invite';
import { z } from 'zod';

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

function fail(path: string): never {
	throw redirect(303, `${path}?error=1`);
}

const createMemberSchema = z.object({
	locale: localeSchema,
	name: personNameSchema,
	email: emailSchema,
	phone: optionalPhoneSchema,
	plan_id: z.string().trim().min(1),
	method: paymentMethodSchema
});

export type CreateMemberState = {
	error?: string;
	fieldErrors?: Record<string, string>;
	success?: boolean;
	memberId?: string;
	emailWarning?: string;
	/** Soft member-cap notice (Starter/Growth); create still succeeded. */
	softCapWarning?: string;
} | null;

export async function createMember(formData: FormData): Promise<CreateMemberState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_members')) {
		return { error: d.common.forbidden };
	}

	const parsed = createMemberSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		name: formString(formData, 'name'),
		email: formString(formData, 'email'),
		phone: formString(formData, 'phone'),
		plan_id: formString(formData, 'plan_id'),
		method: formString(formData, 'method') || 'CASH'
	});
	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}

	const supabase = createClient();
	const dayPass = isDayPassPlanValue(parsed.data.plan_id);

	let planId: string | null = null;
	let listAmount = 0;
	let durationDays = 1;
	let paymentKind: 'PLAN' | 'DAY_PASS' = 'PLAN';

	if (dayPass) {
		const { data: gym, error: gymErr } = await supabase
			.from('gyms')
			.select('day_pass_price')
			.eq('id', workspace.gymId)
			.maybeSingle();

		if (gymErr || gym?.day_pass_price == null) {
			return { error: d.payments.dayPassNotConfigured };
		}
		listAmount = Number(gym.day_pass_price);
		durationDays = 1;
		paymentKind = 'DAY_PASS';
	} else {
		const planIdParsed = uuidSchema.safeParse(parsed.data.plan_id);
		if (!planIdParsed.success) {
			return { fieldErrors: { plan_id: d.validation.invalid } };
		}

		const { data: plan, error: planErr } = await supabase
			.from('plans')
			.select('id, price, duration_days, gym_id, is_active')
			.eq('id', planIdParsed.data)
			.eq('gym_id', workspace.gymId)
			.eq('is_active', true)
			.maybeSingle();

		if (planErr || !plan) {
			return { fieldErrors: { plan_id: d.validation.invalid } };
		}

		planId = plan.id;
		listAmount = Number(plan.price);
		durationDays = plan.duration_days;
		paymentKind = 'PLAN';
	}

	const pricing = parseDeskPricing(formData, listAmount);
	if (!pricing.ok) {
		if (pricing.reason === 'discount_too_high') {
			return { fieldErrors: { amount: d.payments.discountTooHigh } };
		}
		return { fieldErrors: { amount: d.validation.amount } };
	}

	const expires = computeNewMembershipExpiry(durationDays);

	const memberCap = maxActiveMembers(workspace.planTier);
	let softCapWarning: string | undefined;
	if (memberCap != null) {
		const { count, error: countErr } = await supabase
			.from('memberships')
			.select('id', { count: 'exact', head: true })
			.eq('gym_id', workspace.gymId)
			.eq('status', 'ACTIVE');

		if (countErr) {
			console.error('createMember active count', countErr.message);
		} else {
			const active = count ?? 0;
			if (active >= memberCap && isHardMemberCap(workspace.planTier)) {
				return { error: d.members.freemiumMemberLimit };
			}
			if (active >= memberCap && !isHardMemberCap(workspace.planTier)) {
				softCapWarning = d.members.softMemberCapWarning.replace('{n}', String(memberCap));
			}
		}
	}

	const { data: membershipId, error } = await supabase.rpc('create_gym_membership', {
		p_gym_id: workspace.gymId,
		p_full_name: parsed.data.name,
		p_expires_at: expires.toISOString(),
		p_phone: parsed.data.phone,
		p_email: parsed.data.email,
		p_branch_id: null,
		p_plan_id: planId
	});

	if (error || !membershipId) {
		console.error('createMember', error?.message);
		if (isAlreadyMemberAtGymError(error)) {
			return { fieldErrors: { email: d.members.alreadyAtGym } };
		}
		const uniqueField = personUniqueFieldFromError(error);
		if (uniqueField === 'email') {
			return { fieldErrors: { email: d.members.emailInUse } };
		}
		if (uniqueField === 'phone') {
			return { fieldErrors: { phone: d.members.phoneInUse } };
		}
		return { error: d.members.error };
	}

	const { error: payErr } = await supabase.from('payments').insert({
		gym_id: workspace.gymId,
		membership_id: membershipId,
		amount: pricing.amounts.amount,
		list_amount: pricing.amounts.listAmount,
		method: parsed.data.method,
		kind: paymentKind,
		plan_id: planId,
		recorded_by: workspace.userId
	});
	if (payErr) {
		console.error('createMember payment', payErr.message);
		return { error: d.members.error };
	}

	let emailWarning: string | undefined;
	try {
		const { data: membership } = await supabase
			.from('memberships')
			.select('person_id')
			.eq('id', membershipId)
			.maybeSingle();

		if (membership?.person_id) {
			const invite = await inviteAuthUserByEmail({
				email: parsed.data.email,
				fullName: parsed.data.name,
				locale,
				gymName: workspace.gymName,
				kind: 'member',
				nextPath: `/${locale}/invite`
			});

			if (invite.ok) {
				await linkPersonToUser({
					personId: membership.person_id,
					userId: invite.userId
				});
				const { error: inviteStatusErr } = await supabase
					.from('memberships')
					.update({ invite_status: 'PENDING' })
					.eq('id', membershipId)
					.eq('gym_id', workspace.gymId);
				if (inviteStatusErr) {
					console.error('createMember invite_status', inviteStatusErr.message);
				}
				if (!invite.emailSent && !invite.emailSkipped) {
					emailWarning = d.teamInvites.emailFailed;
				}
			} else {
				console.error('createMember invite', invite.message);
				emailWarning = d.teamInvites.emailFailed;
			}
		}
	} catch (e) {
		console.error('createMember invite unexpected', e);
		emailWarning = d.teamInvites.emailFailed;
	}

	return {
		success: true,
		memberId: String(membershipId),
		emailWarning,
		softCapWarning
	};
}

export async function deleteMemberAction(formData: FormData): Promise<void> {
	const locale = localeFromForm(formData);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_members')) {
		fail(`/${locale}/members`);
	}

	const idParsed = uuidSchema.safeParse(formString(formData, 'member_id'));
	if (!idParsed.success) fail(`/${locale}/members`);

	const supabase = createClient();

	const { data: membership } = await supabase
		.from('memberships')
		.select('id, person_id')
		.eq('id', idParsed.data)
		.eq('gym_id', workspace.gymId)
		.maybeSingle();

	if (!membership) fail(`/${locale}/members`);

	const { error } = await supabase
		.from('memberships')
		.delete()
		.eq('id', membership.id)
		.eq('gym_id', workspace.gymId);

	if (error) {
		console.error('deleteMember', error.message);
		fail(`/${locale}/members/${idParsed.data}`);
	}

	throw redirect(303, `/${locale}/members`);
}

const renewSchema = z.object({
	locale: localeSchema,
	member_id: uuidSchema,
	plan_id: uuidSchema,
	method: paymentMethodSchema
});

export async function renewMember(formData: FormData): Promise<void> {
	const locale = localeFromForm(formData);
	const workspace = await getWorkspace();
	const memberId = formString(formData, 'member_id');
	const back = `/${locale}/members/${memberId || ''}`;

	if (!workspace || !canInWorkspace(workspace, 'manage_members')) {
		fail(back);
	}

	const parsed = renewSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		member_id: memberId,
		plan_id: formString(formData, 'plan_id'),
		method: formString(formData, 'method') || 'CASH'
	});
	if (!parsed.success) fail(back);

	const supabase = createClient();

	const { data: plan, error: planErr } = await supabase
		.from('plans')
		.select('id, price, duration_days, gym_id, is_active')
		.eq('id', parsed.data.plan_id)
		.eq('gym_id', workspace.gymId)
		.eq('is_active', true)
		.maybeSingle();

	if (planErr || !plan) fail(back);

	const listAmount = Number(plan.price);
	const pricing = parseDeskPricing(formData, listAmount);
	if (!pricing.ok) fail(back);

	const { data: membership, error: memErr } = await supabase
		.from('memberships')
		.select('id, expires_at, gym_id')
		.eq('id', parsed.data.member_id)
		.eq('gym_id', workspace.gymId)
		.maybeSingle();

	if (memErr || !membership) fail(back);

	const newExpires = computeRenewedExpiry(new Date(membership.expires_at), plan.duration_days);

	const { error: payErr } = await supabase.from('payments').insert({
		gym_id: workspace.gymId,
		membership_id: membership.id,
		amount: pricing.amounts.amount,
		list_amount: pricing.amounts.listAmount,
		method: parsed.data.method,
		kind: 'PLAN',
		plan_id: plan.id,
		recorded_by: workspace.userId
	});
	if (payErr) {
		console.error('renewMember payment', payErr.message);
		fail(back);
	}

	const { error: upErr } = await supabase
		.from('memberships')
		.update({
			expires_at: newExpires.toISOString(),
			status: memberStatusFromExpires(newExpires),
			plan_id: plan.id,
			updated_at: new Date().toISOString()
		})
		.eq('id', membership.id)
		.eq('gym_id', workspace.gymId);

	if (upErr) {
		console.error('renewMember update', upErr.message);
		fail(back);
	}

	throw redirect(303, `/${locale}/members/${membership.id}`);
}

export async function savePersonCareNote(formData: FormData): Promise<{ success?: boolean }> {
	const locale = localeFromForm(formData);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_members')) {
		return {};
	}

	const personId = uuidSchema.safeParse(formString(formData, 'person_id'));
	if (!personId.success) return {};

	const noteRaw = formString(formData, 'medical_note').trim();
	const medicalNote = noteRaw.length === 0 ? null : noteRaw.slice(0, 500);

	const supabase = createClient();
	const { error } = await supabase.from('person_gym_care').upsert(
		{
			gym_id: workspace.gymId,
			person_id: personId.data,
			medical_note: medicalNote,
			updated_by: workspace.userId,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'gym_id,person_id' }
	);

	if (error) {
		console.error('savePersonCareNote', error.message);
		return {};
	}

	return { success: true };
}
