import { redirect } from '@sveltejs/kit';
import {
	acceptPendingInvite,
	declinePendingInvite,
	getPendingInvite,
	invitePasswordPath,
	invitePath
} from '$lib/auth/invite-decision';
import { userNeedsInvitePassword } from '$lib/auth/invite-password';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { getSessionUser } from '$lib/auth/session';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createServiceRoleClient } from '$lib/supabase/admin';
import { createClient } from '$lib/supabase/server';
import { zodFieldErrors } from '$lib/validation/field-errors';
import { formString, localeSchema, passwordSchema } from '$lib/validation/schemas';
import { z } from 'zod';

export type InviteDecideState = {
	error?: string;
} | null;

export async function acceptInviteAction(formData: FormData): Promise<InviteDecideState> {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	const locale = localeParsed.success ? localeParsed.data : 'es';
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	const invite = await getPendingInvite();
	if (!invite) throw redirect(303, await resolvePostAuthPath(locale));

	const result = await acceptPendingInvite(invite);
	if (!result.ok) return { error: d.invite.error };

	// Existing accounts already have a password — skip create-password.
	if (!(await userNeedsInvitePassword(user))) {
		throw redirect(303, await resolvePostAuthPath(locale));
	}

	throw redirect(303, invitePasswordPath(locale));
}

export async function declineInviteAction(formData: FormData): Promise<InviteDecideState> {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	const locale = localeParsed.success ? localeParsed.data : 'es';
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	const invite = await getPendingInvite();
	if (!invite) throw redirect(303, `/${locale}`);

	const result = await declinePendingInvite(invite);
	if (!result.ok) return { error: d.invite.error };

	const supabase = createClient();
	await supabase.auth.signOut();
	throw redirect(303, `/${locale}`);
}

export type InvitePasswordState = {
	error?: string;
	fieldErrors?: Record<string, string>;
} | null;

const passwordFormSchema = z
	.object({
		locale: localeSchema,
		password: passwordSchema,
		confirm: z.string()
	})
	.refine((v) => v.password === v.confirm, {
		message: 'password_mismatch',
		path: ['confirm']
	});

export async function setInvitePasswordAction(formData: FormData): Promise<InvitePasswordState> {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	const locale = localeParsed.success ? localeParsed.data : 'es';
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	if (await getPendingInvite()) throw redirect(303, invitePath(locale));

	const parsed = passwordFormSchema.safeParse({
		locale: localeRaw,
		password: formString(formData, 'password'),
		confirm: formString(formData, 'confirm')
	});

	if (!parsed.success) {
		const fieldErrors = zodFieldErrors(parsed.error, d.validation);
		if (parsed.error.issues.some((i) => i.message === 'password_mismatch')) {
			fieldErrors.confirm = d.invite.passwordMismatch;
		}
		return { fieldErrors };
	}

	const supabase = createClient();
	const { error } = await supabase.auth.updateUser({
		password: parsed.data.password
	});

	if (error) {
		console.error('setInvitePasswordAction', error.message);
		return { error: d.invite.passwordError };
	}

	const admin = createServiceRoleClient();
	if (admin) {
		const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
			app_metadata: { amrap_needs_invite_password: false }
		});
		if (metaErr) {
			console.error('setInvitePasswordAction clear flag', metaErr.message);
		}
	}

	throw redirect(303, await resolvePostAuthPath(locale));
}
