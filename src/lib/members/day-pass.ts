/** Sentinel `plan_id` form value for day-pass / visit registration. */
export const DAY_PASS_PLAN_VALUE = 'DAY_PASS';

export function isDayPassPlanValue(value: string | null | undefined): boolean {
	return value === DAY_PASS_PLAN_VALUE;
}
