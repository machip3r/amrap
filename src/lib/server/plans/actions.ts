import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import {
	amountSchema,
	durationDaysSchema,
	entityNameSchema,
	formString,
	localeSchema,
	uuidSchema
} from '$lib/validation/schemas';
import { zodFieldErrors } from '$lib/validation/field-errors';
import { getDictionary } from '$lib/i18n/dictionaries';
import { canCreatePlan } from '$lib/plans/limits';
import { createClient } from '$lib/supabase/server';
import { z } from 'zod';

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

const createPlanSchema = z.object({
	locale: localeSchema,
	name: entityNameSchema,
	price: amountSchema,
	duration_days: durationDaysSchema
});

const updatePlanSchema = createPlanSchema.extend({
	plan_id: uuidSchema
});

export type PlanFormState = {
	error?: string;
	fieldErrors?: Record<string, string>;
	success?: boolean;
} | null;

export type DayPassPriceState = {
	error?: string;
	fieldErrors?: Record<string, string>;
	success?: boolean;
} | null;

function countActivePlans(gymId: string) {
	const supabase = createClient();
	return supabase
		.from('plans')
		.select('id', { count: 'exact', head: true })
		.eq('gym_id', gymId)
		.eq('is_active', true)
		.then(({ count }) => count ?? 0);
}

export async function createPlan(formData: FormData): Promise<PlanFormState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_plans')) {
		return { error: d.common.forbidden };
	}

	const parsed = createPlanSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		name: formString(formData, 'name'),
		price: formString(formData, 'price'),
		duration_days: formString(formData, 'duration_days')
	});
	if (!parsed.success) {
		return {
			fieldErrors: zodFieldErrors(parsed.error, d.validation, {
				name: 'entityName'
			})
		};
	}

	const activeCount = await countActivePlans(workspace.gymId);
	if (!canCreatePlan(workspace.planTier, activeCount)) {
		return { error: d.plans.planLimit };
	}

	const supabase = createClient();
	const { error } = await supabase.from('plans').insert({
		gym_id: workspace.gymId,
		name: parsed.data.name,
		price: parsed.data.price,
		duration_days: parsed.data.duration_days,
		is_active: true
	});

	if (error) {
		console.error('createPlan', error.message);
		return { error: d.plans.error };
	}

	return { success: true };
}

export async function updatePlan(formData: FormData): Promise<PlanFormState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_plans')) {
		return { error: d.common.forbidden };
	}

	const parsed = updatePlanSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		plan_id: formString(formData, 'plan_id'),
		name: formString(formData, 'name'),
		price: formString(formData, 'price'),
		duration_days: formString(formData, 'duration_days')
	});
	if (!parsed.success) {
		return {
			fieldErrors: zodFieldErrors(parsed.error, d.validation, {
				name: 'entityName'
			})
		};
	}

	const supabase = createClient();
	const { error } = await supabase
		.from('plans')
		.update({
			name: parsed.data.name,
			price: parsed.data.price,
			duration_days: parsed.data.duration_days
		})
		.eq('id', parsed.data.plan_id)
		.eq('gym_id', workspace.gymId);

	if (error) {
		console.error('updatePlan', error.message);
		return { error: d.plans.error };
	}

	return { success: true };
}

export async function setPlanActive(formData: FormData): Promise<void> {
	const locale = localeFromForm(formData);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_plans')) {
		return;
	}

	const idParsed = uuidSchema.safeParse(formString(formData, 'plan_id'));
	const activeRaw = formString(formData, 'is_active');
	const nextActive = activeRaw === 'true';
	if (!idParsed.success) return;

	if (nextActive) {
		const activeCount = await countActivePlans(workspace.gymId);
		if (!canCreatePlan(workspace.planTier, activeCount)) {
			throw redirect(303, `/${locale}/plans?error=limit`);
		}
	}

	const supabase = createClient();
	const { error } = await supabase
		.from('plans')
		.update({ is_active: nextActive })
		.eq('id', idParsed.data)
		.eq('gym_id', workspace.gymId);

	if (error) {
		console.error('setPlanActive', error.message);
		throw redirect(303, `/${locale}/plans?error=1`);
	}
}

const dayPassSchema = z.object({
	locale: localeSchema,
	day_pass_price: amountSchema
});

export async function updateDayPassPrice(formData: FormData): Promise<DayPassPriceState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_plans')) {
		return { error: d.common.forbidden };
	}

	const parsed = dayPassSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		day_pass_price: formString(formData, 'day_pass_price')
	});
	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}

	const supabase = createClient();
	const { error } = await supabase
		.from('gyms')
		.update({ day_pass_price: parsed.data.day_pass_price })
		.eq('id', workspace.gymId);

	if (error) {
		console.error('updateDayPassPrice', error.message);
		return { error: d.plans.error };
	}

	return { success: true };
}
