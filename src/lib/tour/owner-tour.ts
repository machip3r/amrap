import type { Locale } from '$lib/i18n/config';

export type OwnerTourStepId =
	| 'dashboard'
	| 'checkin'
	| 'members'
	| 'classes'
	| 'payments'
	| 'plans'
	| 'organization';

export type OwnerTourStep = {
	id: OwnerTourStepId;
	/** Path after locale prefix. */
	path: string;
	selector: string;
	titleKey: keyof import('$lib/i18n/dictionaries').Dictionary['tour'];
	bodyKey: keyof import('$lib/i18n/dictionaries').Dictionary['tour'];
	/** Prefer mobile More sheet target when true. */
	mobileMore?: boolean;
};

export const OWNER_TOUR_STEPS: OwnerTourStep[] = [
	{
		id: 'dashboard',
		path: '/dashboard',
		selector: '[data-tour="dashboard-actions"]',
		titleKey: 'stepDashboardTitle',
		bodyKey: 'stepDashboardBody'
	},
	{
		id: 'checkin',
		path: '/checkin',
		selector: '[data-tour="nav-checkin"]',
		titleKey: 'stepCheckInTitle',
		bodyKey: 'stepCheckInBody'
	},
	{
		id: 'members',
		path: '/members',
		selector: '[data-tour="nav-members"]',
		titleKey: 'stepMembersTitle',
		bodyKey: 'stepMembersBody'
	},
	{
		id: 'classes',
		path: '/classes',
		selector: '[data-tour="nav-classes"]',
		titleKey: 'stepClassesTitle',
		bodyKey: 'stepClassesBody'
	},
	{
		id: 'payments',
		path: '/payments',
		selector: '[data-tour="nav-payments"]',
		titleKey: 'stepPaymentsTitle',
		bodyKey: 'stepPaymentsBody'
	},
	{
		id: 'plans',
		path: '/plans',
		selector: '[data-tour="nav-plans"]',
		titleKey: 'stepPlansTitle',
		bodyKey: 'stepPlansBody'
	},
	{
		id: 'organization',
		path: '/organization',
		selector: '[data-tour="nav-organization"]',
		titleKey: 'stepOrganizationTitle',
		bodyKey: 'stepOrganizationBody',
		mobileMore: true
	}
];

export function ownerTourHref(locale: Locale, path: string) {
	return `/${locale}${path}`;
}
