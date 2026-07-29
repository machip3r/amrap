import type { Locale } from '$lib/i18n/config';
import type { Dictionary } from '$lib/i18n/dictionaries';

export type EntityNotFoundKind =
	| 'member'
	| 'trainer'
	| 'staff'
	| 'class'
	| 'checkin'
	| 'generic';

export type EntityNotFoundCopy = {
	kind: EntityNotFoundKind;
	title: string;
	description: string;
	backHref: string;
	backLabel: string;
	homeHref?: string;
	homeLabel?: string;
};

/** Ignore framework default messages so dictionary titles win. */
function displayTitle(errorMessage: string | null | undefined, fallback: string): string {
	const trimmed = errorMessage?.trim();
	if (!trimmed) return fallback;
	if (/^not\s*found$/i.test(trimmed)) return fallback;
	return trimmed;
}

/** Map a locale path to the friendliest not-found copy + back link. */
export function resolveEntityNotFound(
	pathname: string,
	locale: Locale,
	d: Dictionary,
	errorMessage?: string | null
): EntityNotFoundCopy {
	const prefix = `/${locale}`;
	const path = pathname.replace(/\/$/, '') || prefix;
	const n = d.entityNotFound;

	const landingHref = prefix;
	const dashboardHref = `${prefix}/dashboard`;

	if (path.includes('/members')) {
		return {
			kind: 'member',
			title: displayTitle(errorMessage, n.titleMember),
			description: n.bodyMember,
			backHref: `${prefix}/members`,
			backLabel: n.goMembers,
			homeHref: dashboardHref,
			homeLabel: n.goHome
		};
	}
	if (path.includes('/trainers')) {
		return {
			kind: 'trainer',
			title: displayTitle(errorMessage, n.titleTrainer),
			description: n.bodyTrainer,
			backHref: `${prefix}/trainers`,
			backLabel: n.goTrainers,
			homeHref: dashboardHref,
			homeLabel: n.goHome
		};
	}
	if (path.includes('/staff')) {
		return {
			kind: 'staff',
			title: displayTitle(errorMessage, n.titleStaff),
			description: n.bodyStaff,
			backHref: `${prefix}/staff`,
			backLabel: n.goStaff,
			homeHref: dashboardHref,
			homeLabel: n.goHome
		};
	}
	if (path.includes('/classes')) {
		return {
			kind: 'class',
			title: displayTitle(errorMessage, n.titleClass),
			description: n.bodyClass,
			backHref: `${prefix}/classes`,
			backLabel: n.goClasses,
			homeHref: dashboardHref,
			homeLabel: n.goHome
		};
	}
	if (path.includes('/checkin')) {
		return {
			kind: 'checkin',
			title: displayTitle(errorMessage, n.titleCheckin),
			description: n.bodyCheckin,
			backHref: `${prefix}/checkin`,
			backLabel: n.goCheckin,
			homeHref: dashboardHref,
			homeLabel: n.goHome
		};
	}

	return {
		kind: 'generic',
		title: displayTitle(errorMessage, n.titleGeneric),
		description: n.bodyGeneric,
		backHref: landingHref,
		backLabel: n.goLanding,
		homeHref: dashboardHref,
		homeLabel: n.goHome
	};
}
