import { z } from 'zod';

export const LIMITS = {
	email: 254,
	personName: 120,
	message: 2000
} as const;

const EMAIL_PATTERN =
	/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;

const MESSAGE_PATTERN = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F<>]*$/;

export function sanitizeEmailInput(raw: string): string {
	return raw
		.toLowerCase()
		.replace(/[^\x20-\x7E]/g, '')
		.slice(0, LIMITS.email);
}

export function sanitizePersonNameInput(raw: string): string {
	return raw.replace(/[^\p{L}\p{M}\s'.-]/gu, '').slice(0, LIMITS.personName);
}

export const emailSchema = z
	.string()
	.transform((v) => sanitizeEmailInput(v.trim()))
	.pipe(z.string().min(3).max(LIMITS.email).regex(EMAIL_PATTERN));

export const personNameSchema = z
	.string()
	.transform((v) => sanitizePersonNameInput(v).trim())
	.pipe(z.string().min(1).max(LIMITS.personName).regex(PERSON_NAME_PATTERN));

export const messageSchema = z
	.string()
	.trim()
	.min(1)
	.max(LIMITS.message)
	.regex(MESSAGE_PATTERN);
