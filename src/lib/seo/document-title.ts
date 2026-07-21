import type { Dictionary } from '$lib/i18n/dictionaries';
import type { Locale } from '$lib/i18n/config';

export const DEFAULT_DOCUMENT_BRAND = 'AMRAP';

/** `Page — Brand` (or just brand when the page title is empty). */
export function brandedTitle(
	pageTitle: string,
	brand: string | null | undefined = DEFAULT_DOCUMENT_BRAND
): string {
	const b = brand?.trim() || DEFAULT_DOCUMENT_BRAND;
	const page = pageTitle.trim();
	if (!page || page === DEFAULT_DOCUMENT_BRAND) return b;
	return `${page} — ${b}`;
}

/**
 * Fallback document title from the URL when a page does not set its own.
 * Page-level `<title>` / SeoHead still override this.
 * Pass `brand` for white-label gyms (ops) so tabs show the business name.
 */
export function titleFromPath(
	pathname: string,
	locale: Locale,
	d: Dictionary,
	brand: string | null | undefined = DEFAULT_DOCUMENT_BRAND
): string {
	const parts = pathname.split('/').filter(Boolean);
	// Expect /{locale}/...
	if (parts[0] !== locale) {
		return brandedTitle(DEFAULT_DOCUMENT_BRAND, brand);
	}

	const section = parts[1] ?? '';
	const sub = parts[2] ?? '';

	if (!section) {
		return d.meta.title;
	}

	switch (section) {
		case 'login':
			return brandedTitle(d.login.title, brand);
		case 'register':
			return brandedTitle(d.register.title, brand);
		case 'onboarding':
			return brandedTitle(d.onboarding.title, brand);
		case 'welcome':
			return brandedTitle(d.welcome.titleStaff, brand);
		case 'invite':
			return sub === 'password'
				? brandedTitle(d.invite.passwordTitle, brand)
				: brandedTitle(DEFAULT_DOCUMENT_BRAND, brand);
		case 'no-access':
			return brandedTitle(d.noAccess.title, brand);
		case 'dashboard':
			return brandedTitle(d.dashboard.title, brand);
		case 'members':
			return brandedTitle(d.members.title, brand);
		case 'checkin':
			if (sub === 'history') {
				return brandedTitle(d.checkin.historyTitle, brand);
			}
			return brandedTitle(d.checkin.title, brand);
		case 'classes':
			return brandedTitle(d.classes.title, brand);
		case 'payments':
			return brandedTitle(d.payments.title, brand);
		case 'plans':
			return brandedTitle(d.plans.title, brand);
		case 'staff':
			return brandedTitle(d.staffPage.title, brand);
		case 'trainers':
			return brandedTitle(d.trainers.title, brand);
		case 'timers':
			return brandedTitle(d.nav.timers, brand);
		case 'settings':
			return brandedTitle(d.settings.title, brand);
		case 'organization':
			return brandedTitle(d.organization.title, brand);
		case 'team':
			return brandedTitle(d.nav.staff, brand);
		case 'me':
			switch (sub) {
				case 'classes':
					return brandedTitle(d.member.classes, brand);
				case 'timers':
					return brandedTitle(d.member.timers, brand);
				case 'inbox':
					return brandedTitle(d.member.inbox, brand);
				case 'qr':
					return brandedTitle(d.member.qr, brand);
				default:
					return brandedTitle(d.member.title, brand);
			}
		default:
			return brandedTitle(DEFAULT_DOCUMENT_BRAND, brand);
	}
}
