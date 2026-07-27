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
	homeHref: string;
	homeLabel: string;
};

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

	const homeHref = `${prefix}/dashboard`;
	const homeLabel = n.goHome;

	if (path.includes('/members')) {
		return {
			kind: 'member',
			title: errorMessage?.trim() || n.titleMember,
			description: n.bodyMember,
			backHref: `${prefix}/members`,
			backLabel: n.goMembers,
			homeHref,
			homeLabel
		};
	}
	if (path.includes('/trainers')) {
		return {
			kind: 'trainer',
			title: errorMessage?.trim() || n.titleTrainer,
			description: n.bodyTrainer,
			backHref: `${prefix}/trainers`,
			backLabel: n.goTrainers,
			homeHref,
			homeLabel
		};
	}
	if (path.includes('/staff')) {
		return {
			kind: 'staff',
			title: errorMessage?.trim() || n.titleStaff,
			description: n.bodyStaff,
			backHref: `${prefix}/staff`,
			backLabel: n.goStaff,
			homeHref,
			homeLabel
		};
	}
	if (path.includes('/classes')) {
		return {
			kind: 'class',
			title: errorMessage?.trim() || n.titleClass,
			description: n.bodyClass,
			backHref: `${prefix}/classes`,
			backLabel: n.goClasses,
			homeHref,
			homeLabel
		};
	}
	if (path.includes('/checkin')) {
		return {
			kind: 'checkin',
			title: errorMessage?.trim() || n.titleCheckin,
			description: n.bodyCheckin,
			backHref: `${prefix}/checkin`,
			backLabel: n.goCheckin,
			homeHref,
			homeLabel
		};
	}

	return {
		kind: 'generic',
		title: errorMessage?.trim() || n.titleGeneric,
		description: n.bodyGeneric,
		backHref: homeHref,
		backLabel: homeLabel,
		homeHref,
		homeLabel
	};
}
