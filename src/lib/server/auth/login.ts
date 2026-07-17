import { redirect } from '@sveltejs/kit';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { setPendingConfirmEmail } from '$lib/auth/pending-confirm';
import { setRequestUser } from '$lib/auth/session';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createClient } from '$lib/supabase/server';
import { zodFieldErrors } from '$lib/validation/field-errors';
import {
	emailSchema,
	formString,
	localeSchema,
	loginPasswordSchema
} from '$lib/validation/schemas';
import { z } from 'zod';
import type { Locale } from '$lib/i18n/config';

export type LoginState = {
	error?: string;
	fieldErrors?: Record<string, string>;
} | null;

const loginSchema = z.object({
	locale: localeSchema,
	email: emailSchema,
	password: loginPasswordSchema
});

function isEmailNotConfirmed(message: string, code?: string): boolean {
	if (code === 'email_not_confirmed') return true;
	const m = message.toLowerCase();
	return (
		m.includes('email not confirmed') ||
		m.includes('not confirmed') ||
		m.includes('confirm your email')
	);
}

export async function loginAction(formData: FormData): Promise<LoginState> {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	const locale = localeParsed.success ? localeParsed.data : ('es' as Locale);
	const d = getDictionary(locale);

	const parsed = loginSchema.safeParse({
		locale: localeRaw,
		email: formString(formData, 'email'),
		password: formString(formData, 'password')
	});
	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}

	const supabase = createClient();
	const { data, error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password
	});
	if (error) {
		if (isEmailNotConfirmed(error.message, error.code)) {
			await setPendingConfirmEmail(parsed.data.email);
			throw redirect(303, `/${locale}/login`);
		}
		return { error: d.login.error };
	}

	// Hooks ran before sign-in with locals.user=null; bind the new session so
	// resolvePostAuthPath does not re-hit Auth or treat the user as logged out.
	if (data.user) setRequestUser(data.user);

	throw redirect(303, await resolvePostAuthPath(locale));
}
