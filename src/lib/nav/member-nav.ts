import type { Dictionary } from '$lib/i18n/dictionaries';

export type MemberNavId =
	| 'home'
	| 'membership'
	| 'classes'
	| 'timers'
	| 'inbox'
	| 'profile';

export type MemberNavItemDef = {
	id: MemberNavId;
	/** Path under `/[locale]/me`, e.g. `` or `/classes` */
	path: string;
	getLabel: (d: Dictionary) => string;
	/** Never shown as a bottom primary tab */
	moreOnly?: boolean;
};

/**
 * Mobile bottom tabs: Home · Membership · Classes (+ center My QR + More).
 * Timers / Inbox / Profile via More (and avatar for profile).
 */
export const MEMBER_NAV_ITEMS: MemberNavItemDef[] = [
	{ id: 'home', path: '', getLabel: (d) => d.member.home },
	{ id: 'membership', path: '/membership', getLabel: (d) => d.member.membership },
	{ id: 'classes', path: '/classes', getLabel: (d) => d.member.classes },
	{ id: 'timers', path: '/timers', getLabel: (d) => d.member.timers },
	{ id: 'inbox', path: '/inbox', getLabel: (d) => d.member.inbox },
	{ id: 'profile', path: '/profile', getLabel: (d) => d.member.profile, moreOnly: true }
];

const PRIMARY_ORDER: MemberNavId[] = ['home', 'membership', 'classes', 'timers', 'inbox'];
const MAX_PRIMARY = 3;

export function memberNavHref(prefix: string, path: string) {
	const base = prefix.replace(/\/$/, '');
	if (!path) return base;
	return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function isMemberNavActive(pathname: string, href: string) {
	if (pathname === href) return true;
	// Home is exact only
	if (href.endsWith('/me')) return pathname === href;
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function getSidebarMemberNavItems() {
	return MEMBER_NAV_ITEMS.filter((i) => !i.moreOnly);
}

export function splitMobileMemberNav() {
	const primaryCandidates = PRIMARY_ORDER.map((id) =>
		MEMBER_NAV_ITEMS.find((item) => item.id === id)
	).filter((item): item is MemberNavItemDef => item != null && !item.moreOnly);

	const primary = primaryCandidates.slice(0, MAX_PRIMARY);
	const primaryIds = new Set(primary.map((i) => i.id));
	const more = MEMBER_NAV_ITEMS.filter((i) => i.moreOnly || !primaryIds.has(i.id));
	return { primary, more };
}
