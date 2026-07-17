import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createClient } from '$lib/supabase/server';
import { entityNameSchema, formString, localeSchema, uuidSchema } from '$lib/validation/schemas';
import { z } from 'zod';

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

export type OrgActionState = {
	error?: string;
	success?: boolean;
	message?: string;
} | null;

async function requireBillingWorkspace() {
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
		return null;
	}
	return workspace;
}

export async function requestSubscriptionCheckout(formData: FormData): Promise<OrgActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await requireBillingWorkspace();
	if (!workspace) return { error: d.common.forbidden };

	const tier = formString(formData, 'tier');
	if (!['STARTER', 'GROWTH', 'PRO'].includes(tier)) {
		return { error: d.organization.invalidPlan };
	}

	if (tier === 'PRO') {
		return {
			success: true,
			message: d.organization.contactProPlan
		};
	}

	return {
		success: true,
		message: d.organization.checkoutComingSoon
	};
}

export async function requestCreateGym(formData: FormData): Promise<OrgActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await requireBillingWorkspace();
	if (!workspace) return { error: d.common.forbidden };

	const nameParsed = entityNameSchema.safeParse(formString(formData, 'name'));
	if (!nameParsed.success) {
		return { error: d.common.invalidInput };
	}

	return {
		success: true,
		message: d.organization.createGymComingSoon
	};
}

const scheduleGymDeleteSchema = z.object({
	locale: localeSchema,
	gym_id: uuidSchema,
	confirm_name: entityNameSchema
});

export async function scheduleGymDeletion(formData: FormData): Promise<OrgActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await requireBillingWorkspace();
	if (!workspace) return { error: d.common.forbidden };

	const parsed = scheduleGymDeleteSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		gym_id: formString(formData, 'gym_id'),
		confirm_name: formString(formData, 'confirm_name')
	});
	if (!parsed.success) {
		return { error: d.organization.confirmNameMismatch };
	}

	const supabase = createClient();
	const { data: gym, error: gymErr } = await supabase
		.from('gyms')
		.select('id, name, organization_id, deleted_at')
		.eq('id', parsed.data.gym_id)
		.eq('organization_id', workspace.organizationId)
		.maybeSingle();

	if (gymErr || !gym) {
		return { error: d.organization.deleteFailed };
	}

	if (gym.name.trim().toLowerCase() !== parsed.data.confirm_name.trim().toLowerCase()) {
		return { error: d.organization.confirmNameMismatch };
	}

	const { error } = await supabase
		.from('gyms')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', gym.id)
		.eq('organization_id', workspace.organizationId);

	if (error) {
		console.error('scheduleGymDeletion', error.message);
		return { error: d.organization.deleteFailed };
	}

	if (gym.id === workspace.gymId) {
		throw redirect(303, `/${locale}/organization?deleted=gym`);
	}

	return { success: true, message: d.organization.gymDeletionScheduled };
}

export async function cancelGymDeletion(formData: FormData): Promise<OrgActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await requireBillingWorkspace();
	if (!workspace) return { error: d.common.forbidden };

	const idParsed = uuidSchema.safeParse(formString(formData, 'gym_id'));
	if (!idParsed.success) return { error: d.common.invalidInput };

	const supabase = createClient();
	const { error } = await supabase
		.from('gyms')
		.update({ deleted_at: null })
		.eq('id', idParsed.data)
		.eq('organization_id', workspace.organizationId);

	if (error) {
		console.error('cancelGymDeletion', error.message);
		return { error: d.organization.deleteFailed };
	}

	return { success: true, message: d.organization.deletionCancelled };
}

const scheduleOrgDeleteSchema = z.object({
	locale: localeSchema,
	confirm_name: entityNameSchema
});

export async function scheduleOrganizationDeletion(formData: FormData): Promise<OrgActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await requireBillingWorkspace();
	if (!workspace) return { error: d.common.forbidden };

	const parsed = scheduleOrgDeleteSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		confirm_name: formString(formData, 'confirm_name')
	});
	if (!parsed.success) {
		return { error: d.organization.confirmNameMismatch };
	}

	if (
		workspace.organizationName.trim().toLowerCase() !==
		parsed.data.confirm_name.trim().toLowerCase()
	) {
		return { error: d.organization.confirmNameMismatch };
	}

	const supabase = createClient();
	const now = new Date().toISOString();

	const { error: orgErr } = await supabase
		.from('organizations')
		.update({ deleted_at: now })
		.eq('id', workspace.organizationId);

	if (orgErr) {
		console.error('scheduleOrganizationDeletion org', orgErr.message);
		return { error: d.organization.deleteFailed };
	}

	const { error: gymsErr } = await supabase
		.from('gyms')
		.update({ deleted_at: now })
		.eq('organization_id', workspace.organizationId)
		.is('deleted_at', null);

	if (gymsErr) {
		console.error('scheduleOrganizationDeletion gyms', gymsErr.message);
	}

	throw redirect(303, `/${locale}/login?orgDeleted=1`);
}
