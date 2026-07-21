import type { Dictionary } from '$lib/i18n/dictionaries';
import type { Locale } from '$lib/i18n/config';

/**
 * Fallback document title from the URL when a page does not set its own.
 * Page-level `<title>` / SeoHead still override this.
 */
export function titleFromPath(pathname: string, locale: Locale, d: Dictionary): string {
	const parts = pathname.split('/').filter(Boolean);
	// Expect /{locale}/...
	if (parts[0] !== locale) {
		return 'AMRAP';
	}

	const section = parts[1] ?? '';
	const sub = parts[2] ?? '';

	if (!section) {
		return d.meta.title;
	}

	switch (section) {
		case 'login':
			return `${d.login.title} — AMRAP`;
		case 'register':
			return `${d.register.title} — AMRAP`;
		case 'onboarding':
			return `${d.onboarding.title} — AMRAP`;
		case 'welcome':
			return `${d.welcome.titleStaff} — AMRAP`;
		case 'invite':
			return sub === 'password'
				? `${d.invite.passwordTitle} — AMRAP`
				: 'AMRAP';
		case 'dashboard':
			return `${d.dashboard.title} — AMRAP`;
		case 'members':
			return `${d.members.title} — AMRAP`;
		case 'checkin':
			if (sub === 'history') {
				return `${d.checkin.historyTitle} — AMRAP`;
			}
			return `${d.checkin.title} — AMRAP`;
		case 'classes':
			return `${d.classes.title} — AMRAP`;
		case 'payments':
			return `${d.payments.title} — AMRAP`;
		case 'plans':
			return `${d.plans.title} — AMRAP`;
		case 'staff':
			return `${d.staffPage.title} — AMRAP`;
		case 'trainers':
			return `${d.trainers.title} — AMRAP`;
		case 'timers':
			return `${d.nav.timers} — AMRAP`;
		case 'settings':
			return `${d.settings.title} — AMRAP`;
		case 'organization':
			return `${d.organization.title} — AMRAP`;
		case 'team':
			return `${d.nav.staff} — AMRAP`;
		case 'me':
			switch (sub) {
				case 'classes':
					return `${d.member.classes} — AMRAP`;
				case 'timers':
					return `${d.member.timers} — AMRAP`;
				case 'inbox':
					return `${d.member.inbox} — AMRAP`;
				case 'qr':
					return `${d.member.qr} — AMRAP`;
				default:
					return `${d.member.title} — AMRAP`;
			}
		default:
			return 'AMRAP';
	}
}
