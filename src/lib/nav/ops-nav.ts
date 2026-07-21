import type { Role } from '$lib/types';
import { can } from '$lib/auth/permissions';
import type { Dictionary } from '$lib/i18n/dictionaries';

export type OpsNavId =
	| 'dashboard'
	| 'checkin'
	| 'members'
	| 'classes'
	| 'timers'
	| 'trainers'
	| 'staff'
	| 'plans'
	| 'payments'
	| 'organization'
	| 'settings';

export type OpsNavContext = {
	role: Role;
	canManageSettings: boolean;
	canManageStaff: boolean;
	/** Per-user hide list from `gym_roles.nav_visibility.hidden` */
	hiddenNavIds?: readonly string[];
};

export type OpsNavItemDef = {
	id: OpsNavId;
	/** Path under the locale prefix, e.g. `/dashboard` */
	path: string;
	getLabel: (d: Dictionary) => string;
	visible: (ctx: OpsNavContext) => boolean;
	/** Never shown as a bottom primary tab */
	moreOnly?: boolean;
	/**
	 * Users may hide this from their nav in Settings when they have more than
	 * {@link NAV_SECTION_CHOICE_THRESHOLD} role-allowed main sections.
	 * Dashboard is never customizable.
	 */
	customizable?: boolean;
};

/**
 * Priority order for mobile bottom tabs.
 * Max 3 destinations + center My QR + More (so bars stay tappable).
 */
const OPS_PRIMARY_TAB_ORDER: OpsNavId[] = [
	'dashboard',
	'checkin',
	'members',
	'classes',
	'timers',
	'payments'
];

const MAX_PRIMARY_TABS = 3;

/**
 * If a role has this many main sections or fewer, they see all of them
 * (no hide/show UI). Above this, they can choose what to show.
 */
const NAV_SECTION_CHOICE_THRESHOLD = 5;

/** Nav ids that each user may hide/show in Settings (never includes dashboard). */
const OPS_CUSTOMIZABLE_NAV_IDS: OpsNavId[] = [
	'checkin',
	'members',
	'classes',
	'timers',
	'trainers',
	'staff',
	'plans',
	'payments'
];

const CUSTOMIZABLE_SET = new Set<string>(OPS_CUSTOMIZABLE_NAV_IDS);

export function isCustomizableOpsNavId(id: string): id is OpsNavId {
	return CUSTOMIZABLE_SET.has(id);
}

const OPS_NAV_ITEMS: OpsNavItemDef[] = [
	{
		id: 'dashboard',
		path: '/dashboard',
		getLabel: (d) => d.nav.dashboard,
		visible: () => true
	},
	{
		id: 'checkin',
		path: '/checkin',
		getLabel: (d) => d.nav.checkin,
		visible: ({ role }) => can(role, 'checkin'),
		customizable: true
	},
	{
		id: 'members',
		path: '/members',
		getLabel: (d) => d.nav.members,
		visible: ({ role }) => can(role, 'manage_members'),
		customizable: true
	},
	{
		id: 'classes',
		path: '/classes',
		getLabel: (d) => d.nav.classes,
		visible: ({ role }) => can(role, 'manage_classes'),
		customizable: true
	},
	{
		id: 'timers',
		path: '/timers',
		getLabel: (d) => d.nav.timers,
		visible: ({ role }) => can(role, 'use_timers'),
		customizable: true
	},
	{
		id: 'trainers',
		path: '/trainers',
		getLabel: (d) => d.nav.trainers,
		visible: ({ role, canManageStaff }) => canManageStaff || can(role, 'manage_staff'),
		moreOnly: true,
		customizable: true
	},
	{
		id: 'staff',
		path: '/staff',
		getLabel: (d) => d.nav.staff,
		visible: ({ role, canManageStaff }) => canManageStaff || can(role, 'manage_staff'),
		moreOnly: true,
		customizable: true
	},
	{
		id: 'plans',
		path: '/plans',
		getLabel: (d) => d.nav.plans,
		visible: ({ role }) => can(role, 'manage_plans'),
		moreOnly: true,
		customizable: true
	},
	{
		id: 'payments',
		path: '/payments',
		getLabel: (d) => d.nav.payments,
		visible: ({ role }) => can(role, 'record_payment'),
		customizable: true
	},
	{
		id: 'organization',
		path: '/organization',
		getLabel: (d) => d.shell.gymAdmin,
		visible: ({ canManageSettings }) => canManageSettings,
		moreOnly: true
	},
	{
		id: 'settings',
		path: '/settings',
		getLabel: (d) => d.nav.settings,
		/** Every ops role; sections inside `/settings` are permission-gated. */
		visible: () => true,
		moreOnly: true
	}
];

function isHiddenByUser(ctx: OpsNavContext, id: OpsNavId): boolean {
	if (!ctx.hiddenNavIds?.length) return false;
	return ctx.hiddenNavIds.includes(id);
}

/** Main ops sections for a role (dashboard + role-allowed pages; not org/settings). */
function getRoleMainNavItems(ctx: OpsNavContext): OpsNavItemDef[] {
	return OPS_NAV_ITEMS.filter(
		(item) => item.id !== 'organization' && item.id !== 'settings' && item.visible(ctx)
	);
}

/** True when the role has enough sections that the user may hide/show some. */
export function roleAllowsNavCustomization(ctx: OpsNavContext): boolean {
	return getRoleMainNavItems(ctx).length > NAV_SECTION_CHOICE_THRESHOLD;
}

function passesVisibility(item: OpsNavItemDef, ctx: OpsNavContext): boolean {
	if (!item.visible(ctx)) return false;
	if (item.id === 'dashboard') return true;
	if (item.customizable && roleAllowsNavCustomization(ctx) && isHiddenByUser(ctx, item.id)) {
		return false;
	}
	return true;
}

/**
 * Customizable nav pages this role may hide/show in Settings.
 * Ignores the user's current hide list — only role / permission gates apply.
 * Empty when the role has ≤ {@link NAV_SECTION_CHOICE_THRESHOLD} main sections.
 */
export function getCustomizableOpsNavItems(ctx: OpsNavContext): OpsNavItemDef[] {
	if (!roleAllowsNavCustomization(ctx)) return [];
	return OPS_NAV_ITEMS.filter((item) => Boolean(item.customizable) && item.visible(ctx));
}

/** Main sidebar destinations (excludes org/settings — those live in footer / header). */
export function getSidebarOpsNavItems(ctx: OpsNavContext): OpsNavItemDef[] {
	return OPS_NAV_ITEMS.filter(
		(item) =>
			passesVisibility(item, ctx) && item.id !== 'organization' && item.id !== 'settings'
	);
}

export function getVisibleOpsNavItems(ctx: OpsNavContext): OpsNavItemDef[] {
	return OPS_NAV_ITEMS.filter((item) => passesVisibility(item, ctx));
}

export function splitMobileOpsNav(visible: OpsNavItemDef[]): {
	primary: OpsNavItemDef[];
	more: OpsNavItemDef[];
} {
	const primary: OpsNavItemDef[] = [];
	for (const id of OPS_PRIMARY_TAB_ORDER) {
		if (primary.length >= MAX_PRIMARY_TABS) break;
		const item = visible.find((v) => v.id === id && !v.moreOnly);
		if (item) primary.push(item);
	}
	const primaryIds = new Set(primary.map((p) => p.id));
	const more = visible.filter((v) => !primaryIds.has(v.id));
	return { primary, more };
}

export function opsNavHref(localePrefix: string, path: string): string {
	return `${localePrefix}${path}`;
}

export function isOpsNavActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

/** Parse `gym_roles.nav_visibility` jsonb into a sanitized hidden-id list. */
export function parseHiddenNavIds(raw: unknown): string[] {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
	const hidden = (raw as { hidden?: unknown }).hidden;
	if (!Array.isArray(hidden)) return [];
	const out: string[] = [];
	for (const id of hidden) {
		if (
			typeof id === 'string' &&
			isCustomizableOpsNavId(id) &&
			id !== 'dashboard' &&
			!out.includes(id)
		) {
			out.push(id);
		}
	}
	return out;
}
