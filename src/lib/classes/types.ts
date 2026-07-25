import type { Locale } from '$lib/i18n/config';

type ClassSessionStatus = 'SCHEDULED' | 'CANCELLED';

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
