import { redirect } from '@sveltejs/kit';
import { ensureOrganizationAfterConfirm } from '$lib/auth/ensure-organization';
import {
	clearPendingConfirmEmail,
	setPendingConfirmEmail
} from '$lib/auth/pending-confirm';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { getRequestOrigin } from '$lib/http/origin';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createClient } from '$lib/supabase/server';
import { zodFieldErrors } from '$lib/validation/field-errors';
import { emailSchema, formString, localeSchema, otpSchema } from '$lib/validation/schemas';
import { z } from 'zod';
import type { Locale } from '$lib/i18n/config';

export type ConfirmEmailState = {
	error?: string;
	success?: string;
	email?: string;
	fieldErrors?: Record<string, string>;
} | null;

const verifySchema = z.object({
	locale: localeSchema,
	email: emailSchema,
	otp: otpSchema
});

const resendSchema = z.object({
	locale: localeSchema,
	email: emailSchema
});

function localeFrom(formData: FormData): Locale {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : 'es';
}

function isRateLimited(message: string): boolean {
	const m = message.toLowerCase();
	return (
		m.includes('rate limit') ||
		m.includes('only request this after') ||
		m.includes('security purposes') ||
		m.includes('too many requests')
	);
}

export async function verifySignupOtpAction(formData: FormData): Promise<ConfirmEmailState> {
	const locale = localeFrom(formData);
	const d = getDictionary(locale);

	const parsed = verifySchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		email: formString(formData, 'email'),
		otp: formString(formData, 'otp')
	});
	if (!parsed.success) {
		return {
			fieldErrors: zodFieldErrors(parsed.error, d.validation),
			email: formString(formData, 'email') || undefined
		};
	}

	const supabase = createClient();
	const { error } = await supabase.auth.verifyOtp({
		email: parsed.data.email,
		token: parsed.data.otp,
		type: 'signup'
	});

	if (error) {
		console.error('verifySignupOtpAction', error.message);
		return {
			fieldErrors: { otp: d.confirmEmail.invalidOtp },
			email: parsed.data.email
		};
	}

	await ensureOrganizationAfterConfirm(parsed.data.email);
	throw redirect(303, await resolvePostAuthPath(locale));
}

export async function resendSignupOtpAction(formData: FormData): Promise<ConfirmEmailState> {
	const locale = localeFrom(formData);
	const d = getDictionary(locale);

	const parsed = resendSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		email: formString(formData, 'email')
	});
	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}

	const origin = getRequestOrigin();
	const redirectTo = `${origin}/auth/confirm?next=/${locale}/onboarding`;
	const supabase = createClient();

	const { error } = await supabase.auth.resend({
		type: 'signup',
		email: parsed.data.email,
		options: {
			emailRedirectTo: redirectTo
		}
	});

	if (error) {
		console.error('resendSignupOtpAction', error.message, { redirectTo });
		if (isRateLimited(error.message)) {
			return {
				error: d.confirmEmail.resendRateLimited,
				email: parsed.data.email
			};
		}
		return {
			error: d.confirmEmail.resendFailed,
			email: parsed.data.email
		};
	}

	await setPendingConfirmEmail(parsed.data.email);
	return {
		success: d.confirmEmail.resendOk,
		email: parsed.data.email
	};
}

export async function clearPendingConfirmAction(formData: FormData): Promise<never> {
	const locale = localeFrom(formData);
	await clearPendingConfirmEmail();
	const from = formString(formData, 'from');
	if (from === 'login') {
		throw redirect(303, `/${locale}/login`);
	}
	throw redirect(303, `/${locale}/register`);
}
