import { canInWorkspace } from '$lib/auth/permissions';
import type { Workspace } from '$lib/types';
import { loadSessionsForWeek } from '$lib/classes/queries';
import { formatSessionTime, startOfWeekMonday, type ClassSessionRow } from '$lib/classes/types';
import type { Locale } from '$lib/i18n/config';
import type { Dictionary } from '$lib/i18n/dictionaries';
import { memberStatusFromExpires } from '$lib/members/dates';
import { createClient } from '$lib/supabase/server';

const EXPIRING_WINDOW_DAYS = 7;
const CRITICAL_EXPIRING_DAYS = 3;
const ACCESS_LOG_LIMIT = 8;

type PersonEmbed = { full_name: string } | { full_name: string }[] | null;
type PlanEmbed = { name: string } | { name: string }[] | null;
type MembershipEmbed =
	| { expires_at: string; plans: PlanEmbed }
	| { expires_at: string; plans: PlanEmbed }[]
	| null;

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

function startOfLocalDay(d: Date) {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

function addDays(d: Date, days: number) {
	const x = new Date(d);
	x.setDate(x.getDate() + days);
	return x;
}

function dayKey(d: Date) {
	return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
	return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function pickHero(
	sessions: ClassSessionRow[],
	nowIso: string,
	todayKey: string
): ClassSessionRow | null {
	const active = sessions.find(
		(s) => s.status !== 'cancelled' && s.starts_at <= nowIso && s.ends_at > nowIso
	);
	if (active) return active;

	const upcomingToday = sessions
		.filter((s) => {
			if (s.status === 'cancelled' || s.starts_at <= nowIso) return false;
			const local = new Date(s.starts_at);
			const key = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
			return key === todayKey;
		})
		.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
	if (upcomingToday[0]) return upcomingToday[0];

	const upcomingWeek = sessions
		.filter((s) => s.status !== 'cancelled' && s.starts_at > nowIso)
		.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
	return upcomingWeek[0] ?? null;
}

export async function loadTrainerDashboard(
	locale: Locale,
	workspace: Workspace,
	labels: Dictionary['dashboard']
) {
	const supabase = createClient();
	const now = new Date();
	const weekStart = startOfWeekMonday(now);
	const nowIso = now.toISOString();
	const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

	const [{ data: classLinks }, sessions] = await Promise.all([
		supabase
			.from('class_trainers')
			.select('class_id, classes!inner ( id, name, is_active, gym_id )')
			.eq('user_id', workspace.userId),
		loadSessionsForWeek(supabase, workspace.gymId, weekStart, {
			trainerUserId: workspace.userId
		})
	]);

	const myClasses = (classLinks ?? []).filter((row) => {
		const cls = Array.isArray(row.classes) ? row.classes[0] : row.classes;
		const c = cls as { gym_id?: string; is_active?: boolean } | null;
		return c?.gym_id === workspace.gymId && c?.is_active !== false;
	});

	const hero = pickHero(sessions, nowIso, todayKey);
	const heroLive = Boolean(hero) && hero!.starts_at <= nowIso && hero!.ends_at > nowIso;

	const upcoming = sessions
		.filter(
			(s) =>
				s.status !== 'cancelled' && s.starts_at >= nowIso && (!hero || s.id !== hero.id)
		)
		.slice(0, 6)
		.map((s) => ({
			...s,
			timeLabel: formatSessionTime(s.starts_at, locale)
		}));

	const sessionsThisWeek = sessions.filter((s) => s.status !== 'cancelled').length;
	const bookedThisWeek = sessions.reduce((sum, s) => sum + (s.confirmed_count ?? 0), 0);

	const todayDate = new Intl.DateTimeFormat(locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(now);

	return {
		kind: 'trainer' as const,
		labels,
		locale,
		todayDate,
		coachLabel: workspace.fullName?.trim() || '—',
		hero: hero
			? {
					...hero,
					timeLabel: formatSessionTime(hero.starts_at, locale),
					live: heroLive
				}
			: null,
		myClassesCount: myClasses.length,
		sessionsThisWeek,
		bookedThisWeek,
		upcoming
	};
}

export async function loadOpsDashboard(
	locale: Locale,
	workspace: Workspace,
	d: Dictionary
) {
	const supabase = createClient();
	const gymId = workspace.gymId;

	const now = new Date();
	const nowIso = now.toISOString();
	const todayStart = startOfLocalDay(now);
	const weekStart = addDays(todayStart, -6);
	const expiringEnd = addDays(now, EXPIRING_WINDOW_DAYS);
	const criticalEnd = addDays(now, CRITICAL_EXPIRING_DAYS);

	const weekDayRanges = Array.from({ length: 7 }, (_, i) => {
		const day = addDays(weekStart, i);
		return { day, next: addDays(day, 1) };
	});

	const [
		activeRes,
		checkInsTodayRes,
		expiringRes,
		weekDayCountRes,
		recentRes,
		expiredAlertsRes,
		soonAlertsRes,
		planRowsRes
	] = await Promise.all([
		supabase
			.from('memberships')
			.select('id', { count: 'exact', head: true })
			.eq('gym_id', gymId)
			.gte('expires_at', nowIso),
		supabase
			.from('check_ins')
			.select('id', { count: 'exact', head: true })
			.eq('gym_id', gymId)
			.gte('checked_in_at', todayStart.toISOString()),
		supabase
			.from('memberships')
			.select('id', { count: 'exact', head: true })
			.eq('gym_id', gymId)
			.gte('expires_at', nowIso)
			.lte('expires_at', expiringEnd.toISOString()),
		Promise.all(
			weekDayRanges.map(({ day, next }) =>
				supabase
					.from('check_ins')
					.select('id', { count: 'exact', head: true })
					.eq('gym_id', gymId)
					.gte('checked_in_at', day.toISOString())
					.lt('checked_in_at', next.toISOString())
			)
		),
		supabase
			.from('check_ins')
			.select(
				`
        id,
        checked_in_at,
        membership_id,
        persons ( full_name ),
        memberships (
          expires_at,
          plans ( name )
        )
      `
			)
			.eq('gym_id', gymId)
			.order('checked_in_at', { ascending: false })
			.limit(ACCESS_LOG_LIMIT),
		supabase
			.from('memberships')
			.select(
				`
        id,
        expires_at,
        persons ( full_name )
      `
			)
			.eq('gym_id', gymId)
			.lt('expires_at', nowIso)
			.order('expires_at', { ascending: false })
			.limit(4),
		supabase
			.from('memberships')
			.select(
				`
        id,
        expires_at,
        persons ( full_name )
      `
			)
			.eq('gym_id', gymId)
			.gte('expires_at', nowIso)
			.lte('expires_at', criticalEnd.toISOString())
			.order('expires_at', { ascending: true })
			.limit(4),
		supabase
			.from('plans')
			.select('id, name, price, duration_days')
			.eq('gym_id', gymId)
			.eq('is_active', true)
			.order('created_at', { ascending: false })
	]);

	const registerPlans = (planRowsRes.data ?? []).map((p) => ({
		id: p.id as string,
		name: p.name as string,
		price: Number(p.price),
		duration_days: p.duration_days as number
	}));

	const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
	const weeklyDays = weekDayRanges.map(({ day }, i) => ({
		label: weekdayFmt.format(day),
		count: weekDayCountRes[i]?.count ?? 0,
		isToday: dayKey(day) === dayKey(todayStart)
	}));

	const recentCheckIns = (recentRes.data ?? []).map((row) => {
		const person = firstEmbed(row.persons as PersonEmbed);
		const membership = firstEmbed(row.memberships as MembershipEmbed);
		const plan = firstEmbed(membership?.plans ?? null);
		const name = person?.full_name ?? '—';
		const expiresAt = membership?.expires_at ?? nowIso;
		const status = memberStatusFromExpires(expiresAt);
		return {
			id: row.id as string,
			membershipId: row.membership_id as string,
			name,
			initials: initials(name),
			time: new Intl.DateTimeFormat(locale, {
				hour: '2-digit',
				minute: '2-digit'
			}).format(new Date(row.checked_in_at as string)),
			planName: plan?.name ?? d.dashboard.noPlan,
			status
		};
	});

	const alerts = [
		...(expiredAlertsRes.data ?? []).map((row) => {
			const person = firstEmbed(row.persons as PersonEmbed);
			return {
				id: row.id as string,
				name: person?.full_name ?? '—',
				kind: 'expired' as const
			};
		}),
		...(soonAlertsRes.data ?? []).map((row) => {
			const person = firstEmbed(row.persons as PersonEmbed);
			return {
				id: row.id as string,
				name: person?.full_name ?? '—',
				kind: 'expiring' as const
			};
		})
	].slice(0, 6);

	const todayDate = new Intl.DateTimeFormat(locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(now);

	return {
		kind: 'ops' as const,
		locale,
		todayDate,
		activeCount: activeRes.count ?? 0,
		checkInsToday: checkInsTodayRes.count ?? 0,
		expiringCount: expiringRes.count ?? 0,
		weeklyDays,
		recentCheckIns,
		alerts,
		canCheckIn: canInWorkspace(workspace, 'checkin'),
		canManageMembers: canInWorkspace(workspace, 'manage_members'),
		canManageStaff: canInWorkspace(workspace, 'manage_staff'),
		registerPlans
	};
}
