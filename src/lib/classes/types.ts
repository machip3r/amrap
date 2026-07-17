import type { Locale } from '$lib/i18n/config';

export type ClassBookingStatus =
	| 'confirmed'
	| 'waitlisted'
	| 'cancelled'
	| 'attended'
	| 'no_show';

export type ClassSessionStatus = 'scheduled' | 'cancelled';

export type ClassScheduleRecurrence = 'none' | 'weekly';

export type ClassSessionRow = {
	id: string;
	class_id: string;
	gym_id: string;
	schedule_id: string | null;
	starts_at: string;
	ends_at: string;
	capacity: number | null;
	status: ClassSessionStatus;
	class_name?: string;
	confirmed_count?: number;
	waitlist_count?: number;
};

export type ClassBookingRow = {
	id: string;
	session_id: string;
	person_id: string;
	membership_id: string;
	status: ClassBookingStatus;
	waitlist_position: number | null;
	booked_at: string;
	person_name?: string;
};

export type ClassScheduleRow = {
	id: string;
	class_id: string;
	gym_id: string;
	recurrence: ClassScheduleRecurrence;
	days_of_week: number[];
	local_time: string;
	timezone: string;
	valid_from: string;
	valid_until: string | null;
	capacity: number | null;
	duration_minutes: number | null;
	is_active: boolean;
};

export function startOfWeekMonday(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	const day = x.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	x.setDate(x.getDate() + diff);
	return x;
}

export function addDays(d: Date, n: number): Date {
	const x = new Date(d);
	x.setDate(x.getDate() + n);
	return x;
}

export function formatSessionTime(iso: string, locale: Locale): string {
	try {
		return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(iso));
	} catch {
		return iso;
	}
}
