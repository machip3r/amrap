import type { OrgPlanTier } from '$lib/types';

/** Compare-table feature rows (values are display tokens resolved in i18n). */
export type PlanCompareValue = 'yes' | 'no' | 'limited' | 'soon' | string;

export type PlanCompareFeatureId =
	| 'gyms'
	| 'members'
	| 'staff'
	| 'packages'
	| 'branding'
	| 'watermark'
	| 'multiGym'
	| 'onlineBilling';

export const PLAN_COMPARE_TIERS: OrgPlanTier[] = ['FREEMIUM', 'STARTER', 'GROWTH', 'PRO'];

export const PLAN_COMPARE_FEATURES: {
	id: PlanCompareFeatureId;
	values: Record<OrgPlanTier, PlanCompareValue>;
}[] = [
	{
		id: 'gyms',
		values: {
			FREEMIUM: '1',
			STARTER: '1',
			GROWTH: '2–3',
			PRO: '4+'
		}
	},
	{
		id: 'members',
		values: {
			FREEMIUM: '30',
			STARTER: '~500',
			GROWTH: '~500',
			PRO: '∞'
		}
	},
	{
		id: 'staff',
		values: {
			FREEMIUM: '2',
			STARTER: '5',
			GROWTH: '5/gym',
			PRO: '∞'
		}
	},
	{
		id: 'packages',
		values: {
			FREEMIUM: '2',
			STARTER: '∞',
			GROWTH: '∞',
			PRO: '∞'
		}
	},
	{
		id: 'branding',
		values: {
			FREEMIUM: 'no',
			STARTER: 'limited',
			GROWTH: 'soon',
			PRO: 'yes'
		}
	},
	{
		id: 'watermark',
		values: {
			FREEMIUM: 'yes',
			STARTER: 'yes',
			GROWTH: 'no',
			PRO: 'no'
		}
	},
	{
		id: 'multiGym',
		values: {
			FREEMIUM: 'no',
			STARTER: 'no',
			GROWTH: 'yes',
			PRO: 'yes'
		}
	},
	{
		id: 'onlineBilling',
		values: {
			FREEMIUM: 'no',
			STARTER: 'soon',
			GROWTH: 'soon',
			PRO: 'yes'
		}
	}
];
