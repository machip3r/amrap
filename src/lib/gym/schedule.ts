/** Gym weekly schedule weekday tokens (DB / forms — always UPPERCASE). */
export const GYM_WEEKDAYS = [
	'MONDAY',
	'TUESDAY',
	'WEDNESDAY',
	'THURSDAY',
	'FRIDAY',
	'SATURDAY',
	'SUNDAY'
] as const;

export type GymWeekday = (typeof GYM_WEEKDAYS)[number];

export type GymWeeklySchedule = {
	enabledDays: GymWeekday[];
	openTime: string;
	closeTime: string;
};

export const DEFAULT_GYM_SCHEDULE_DAYS: GymWeekday[] = [
	'MONDAY',
	'TUESDAY',
	'WEDNESDAY',
	'THURSDAY',
	'FRIDAY'
];

export const DEFAULT_GYM_OPEN_TIME = '06:00';
export const DEFAULT_GYM_CLOSE_TIME = '22:00';

const WEEKDAY_SET = new Set<string>(GYM_WEEKDAYS);

export function isGymWeekday(value: string): value is GymWeekday {
	return WEEKDAY_SET.has(value);
}

/** Dedupe + sort into Monday→Sunday order. */
export function normalizeGymWeekdays(raw: readonly string[]): GymWeekday[] {
	const set = new Set<GymWeekday>();
	for (const day of raw) {
		const token = String(day).trim().toUpperCase();
		if (isGymWeekday(token)) set.add(token);
	}
	return GYM_WEEKDAYS.filter((d) => set.has(d));
}

/** Strip seconds from Postgres `time` / ISO-ish strings → `HH:MM`. */
export function formatGymTimeInput(raw: string | null | undefined): string | null {
	if (raw == null) return null;
	const trimmed = String(raw).trim();
	if (!trimmed) return null;
	const match = trimmed.match(/^(\d{2}):(\d{2})/);
	if (!match) return null;
	return `${match[1]}:${match[2]}`;
}

export function gymHasWeeklySchedule(input: {
	schedule_enabled_days?: string[] | null;
	schedule_open_time?: string | null;
	schedule_close_time?: string | null;
}): boolean {
	const days = normalizeGymWeekdays(input.schedule_enabled_days ?? []);
	const open = formatGymTimeInput(input.schedule_open_time);
	const close = formatGymTimeInput(input.schedule_close_time);
	return days.length > 0 && open != null && close != null;
}

export function parseGymScheduleFromRow(row: {
	schedule_enabled_days?: string[] | null;
	schedule_open_time?: string | null;
	schedule_close_time?: string | null;
} | null): GymWeeklySchedule | null {
	if (!row || !gymHasWeeklySchedule(row)) return null;
	return {
		enabledDays: normalizeGymWeekdays(row.schedule_enabled_days ?? []),
		openTime: formatGymTimeInput(row.schedule_open_time)!,
		closeTime: formatGymTimeInput(row.schedule_close_time)!
	};
}
