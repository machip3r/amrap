/** SvelteKit `depends` / `invalidate` keys for targeted ops data refresh. */
export const OPS_LOAD_DEPS = {
	workspace: 'amrap:ops-workspace',
	members: 'amrap:members',
	payments: 'amrap:payments',
	checkin: 'amrap:checkin',
	team: 'amrap:team',
	plans: 'amrap:plans',
	classes: 'amrap:classes',
	branding: 'amrap:branding',
	dashboard: 'amrap:dashboard'
} as const;
