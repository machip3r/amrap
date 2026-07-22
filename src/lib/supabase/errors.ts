/**
 * Postgres / PostgREST unique_violation helpers for app-facing errors.
 */

type DbError = { code?: string; message?: string } | null | undefined;

export function isPostgresUniqueViolation(error: DbError): boolean {
	if (!error) return false;
	if (error.code === '23505') return true;
	const m = (error.message ?? '').toLowerCase();
	return m.includes('duplicate key') || m.includes('unique constraint');
}

export type PersonUniqueField = 'email' | 'phone' | 'user_id' | 'qr_code';

/** Best-effort column from a unique violation on `public.persons`. */
export function personUniqueFieldFromError(error: DbError): PersonUniqueField | null {
	if (!error || !isPostgresUniqueViolation(error)) return null;
	const m = (error.message ?? '').toLowerCase();
	if (m.includes('persons_email') || m.includes('email_unique')) return 'email';
	if (m.includes('persons_phone') || m.includes('phone_unique')) return 'phone';
	if (m.includes('persons_user_id') || m.includes('user_id')) return 'user_id';
	if (m.includes('persons_qr') || m.includes('qr_code')) return 'qr_code';
	// Fallback: message often includes the column in detail
	if (m.includes('(email)')) return 'email';
	if (m.includes('(phone)')) return 'phone';
	return null;
}

/** `create_gym_membership` when the person is already on this gym. */
export function isAlreadyMemberAtGymError(error: DbError): boolean {
	const m = (error?.message ?? '').toLowerCase();
	return m.includes('already has membership at this gym');
}
