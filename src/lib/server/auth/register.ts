import { redirect } from '@sveltejs/kit';
import { setPendingConfirmSignup } from '$lib/auth/pending-confirm';
import { setRequestUser } from '$lib/auth/session';
import { getRequestOrigin } from '$lib/http/origin';
import { getDictionary } from '$lib/i18n/dictionaries';
import { bootstrapOrganizationAccount } from '$lib/supabase/admin';
import { createClient } from '$lib/supabase/server';
import { zodFieldErrors } from '$lib/validation/field-errors';
import {
	emailSchema,
	entityNameSchema,
	formString,
	localeSchema,
	passwordSchema
} from '$lib/validation/schemas';
import { z } from 'zod';
import type { Locale } from '$lib/i18n/config';

export type RegisterState = {
	error?: string;
	fieldErrors?: Record<string, string>;
} | null;

function looksLikeEmailAlreadyRegistered(msg: string): boolean {
	const m = msg.toLowerCase();
	return (
		m.includes('already been registered') ||
		m.includes('already registered') ||
		m.includes('user already registered') ||
		m.includes('email address is already')
	);
}

function looksLikeEmailRateLimited(msg: string): boolean {
	const m = msg.toLowerCase();
	return (
		m.includes('rate limit') ||
		m.includes('email rate limit exceeded') ||
		m.includes('only request this after') ||
		m.includes('too many requests')
	);
}

function looksLikeEmailAddressInvalid(msg: string): boolean {
	const m = msg.toLowerCase();
	return (
		(m.includes('email address') && m.includes('invalid')) ||
		m.includes('example and test domains') ||
		m.includes('email_address_invalid')
	);
}

const registerSchema = z
	.object({
		locale: localeSchema,
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema,
		organizationName: entityNameSchema
	})
	.refine((v) => v.password === v.confirmPassword, {
		path: ['confirmPassword'],
		message: 'mismatch'
	});

export async function registerAction(formData: FormData): Promise<RegisterState> {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	const locale = localeParsed.success ? localeParsed.data : ('es' as Locale);
	const d = getDictionary(locale);

	const parsed = registerSchema.safeParse({
		locale: localeRaw,
		email: formString(formData, 'email'),
		password: formString(formData, 'password'),
		confirmPassword: formString(formData, 'confirmPassword'),
		organizationName: formString(formData, 'organizationName')
	});

	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}

	const { email, password, organizationName } = parsed.data;

	const supabase = createClient();
	const origin = getRequestOrigin();
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${origin}/auth/confirm?next=/${locale}/onboarding`,
			data: { locale }
		}
	});

	if (error) {
		const authDetail = {
			message: error.message,
			code: 'code' in error ? error.code : undefined,
			status: 'status' in error ? error.status : undefined,
			name: error.name
		};
		console.error('registerAction signUp', authDetail);
		const msg = error.message || String(authDetail.code ?? '');
		if (looksLikeEmailAlreadyRegistered(msg)) {
			return { error: d.register.emailInUse };
		}
		if (looksLikeEmailRateLimited(msg)) {
			return { error: d.register.emailRateLimited };
		}
		if (looksLikeEmailAddressInvalid(msg)) {
			return { error: d.register.emailInvalid };
		}
		return { error: d.register.error };
	}

	if (!data.user) {
		return { error: d.register.error };
	}

	// Email confirmation required — seed org via admin (best-effort) while setting
	// the pending cookie so the OTP UI can render without waiting on a waterfall.
	if (!data.session) {
		const [boot] = await Promise.all([
			bootstrapOrganizationAccount(data.user.id, organizationName),
			setPendingConfirmSignup({ email, organizationName })
		]);
		if (!boot.ok) {
			console.warn('registerAction bootstrap deferred', boot.message);
		}
		throw redirect(303, `/${locale}/register`);
	}

	// Immediate session (confirm-email off) — bind locals so any same-request
	// helpers see the new user, then bootstrap org and land on onboarding.
	setRequestUser(data.user);

	const { error: rpcError } = await supabase.rpc('register_organization_account', {
		p_organization_name: organizationName
	});

	if (rpcError) {
		console.error('registerAction rpc', rpcError.message);
		return { error: d.register.rpcFailed };
	}

	throw redirect(303, `/${locale}/onboarding`);
}
