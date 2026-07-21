import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import {
	emailSchema,
	formString,
	localeSchema,
	optionalPhoneSchema,
	personNameSchema,
	uuidSchema
} from '$lib/validation/schemas';
import { zodFieldErrors } from '$lib/validation/field-errors';
import { getDictionary } from '$lib/i18n/dictionaries';
import { canInviteStaff } from '$lib/plans/limits';
import { inviteAuthUserByEmail, upsertPersonForUser } from '$lib/team/invite';
import { countStaffAndTrainers } from '$lib/team/queries';
import { createClient } from '$lib/supabase/server';
import { z } from 'zod';

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

const teamRoleSchema = z.enum(['trainer', 'staff']);

const createTeamSchema = z.object({
	locale: localeSchema,
	name: personNameSchema,
	email: emailSchema,
	phone: optionalPhoneSchema,
	role: teamRoleSchema
});

export type CreateTeamMemberState = {
	error?: string;
	fieldErrors?: Record<string, string>;
	success?: boolean;
	teamMemberId?: string;
	role?: 'trainer' | 'staff';
	emailWarning?: string;
} | null;

export async function createStaffOrTrainer(
	formData: FormData
): Promise<CreateTeamMemberState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_staff')) {
		return { error: d.common.forbidden };
	}

	const parsed = createTeamSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		name: formString(formData, 'name'),
		email: formString(formData, 'email'),
		phone: formString(formData, 'phone'),
		role: formString(formData, 'role') || 'staff'
	});
	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}

	const supabase = createClient();
	const seatCount = await countStaffAndTrainers(supabase, workspace.gymId);
	if (!canInviteStaff(workspace.planTier, seatCount)) {
		return { error: d.teamInvites.seatLimit };
	}

	const dbRole = parsed.data.role === 'trainer' ? 'TRAINER' : 'STAFF';
	const roleLabel =
		parsed.data.role === 'trainer' ? d.registerUser.roleTrainer : d.registerUser.roleStaff;

	const invite = await inviteAuthUserByEmail({
		email: parsed.data.email,
		fullName: parsed.data.name,
		locale,
		gymName: workspace.gymName,
		kind: 'team',
		roleLabel,
		nextPath: `/${locale}/invite`
	});

	if (!invite.ok) {
		console.error('createStaffOrTrainer invite', invite.message);
		return { error: d.teamInvites.error };
	}

	const person = await upsertPersonForUser({
		userId: invite.userId,
		fullName: parsed.data.name,
		email: parsed.data.email,
		phone: parsed.data.phone
	});
	if (!person.ok) {
		if (person.uniqueField === 'email') {
			return { fieldErrors: { email: d.teamInvites.emailInUse } };
		}
		if (person.uniqueField === 'phone') {
			return { fieldErrors: { phone: d.teamInvites.phoneInUse } };
		}
		return { error: d.teamInvites.error };
	}

	const { data: existingRole } = await supabase
		.from('gym_roles')
		.select('id, role')
		.eq('gym_id', workspace.gymId)
		.eq('user_id', invite.userId)
		.maybeSingle();

	if (existingRole) {
		if (existingRole.role === 'OWNER') {
			return { error: d.teamInvites.alreadyOwner };
		}
		return { error: d.teamInvites.alreadyOnTeam };
	}

	const { data: roleRow, error: roleErr } = await supabase
		.from('gym_roles')
		.insert({
			gym_id: workspace.gymId,
			user_id: invite.userId,
			role: dbRole,
			is_provisional_owner: false,
			invite_status: 'pending'
		})
		.select('id')
		.single();

	if (roleErr || !roleRow) {
		console.error('createStaffOrTrainer gym_roles', roleErr?.message);
		return { error: d.teamInvites.error };
	}

	return {
		success: true,
		teamMemberId: roleRow.id,
		role: parsed.data.role,
		emailWarning:
			invite.emailSent || invite.emailSkipped ? undefined : d.teamInvites.emailFailed
	};
}

export async function removeTeamMemberAction(formData: FormData): Promise<void> {
	const locale = localeFromForm(formData);
	const workspace = await getWorkspace();
	const roleHint = formString(formData, 'list_role');
	const back = roleHint === 'trainer' ? `/${locale}/trainers` : `/${locale}/staff`;

	if (!workspace || !canInWorkspace(workspace, 'manage_staff')) {
		throw redirect(303, back);
	}

	const idParsed = uuidSchema.safeParse(formString(formData, 'team_member_id'));
	if (!idParsed.success) {
		throw redirect(303, back);
	}

	const supabase = createClient();
	const { data: row } = await supabase
		.from('gym_roles')
		.select('id, role, gym_id, user_id')
		.eq('id', idParsed.data)
		.eq('gym_id', workspace.gymId)
		.maybeSingle();

	if (!row || (row.role !== 'STAFF' && row.role !== 'TRAINER')) {
		throw redirect(303, back);
	}

	if (row.user_id === workspace.userId) {
		throw redirect(303, back);
	}

	const { error } = await supabase.from('gym_roles').delete().eq('id', row.id);
	if (error) {
		console.error('removeTeamMemberAction', error.message);
	}

	throw redirect(303, back);
}
