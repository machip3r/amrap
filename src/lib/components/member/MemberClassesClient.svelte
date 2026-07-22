<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import List from '@lucide/svelte/icons/list';
	import ListPlus from '@lucide/svelte/icons/list-plus';
	import X from '@lucide/svelte/icons/x';
	import PageLoader from '$lib/components/ui/PageLoader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		addDays,
		formatSessionTime,
		startOfWeekMonday
	} from '$lib/classes/types';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';

	export type MemberSessionCard = {
		id: string;
		className: string;
		startsAt: string;
		capacity: number | null;
		confirmedCount: number;
		waitlistCount: number;
		myStatus: string | null;
		myBookingId: string | null;
	};

	export type MemberBookingCard = {
		id: string;
		className: string;
		startsAt: string;
		status: string;
		upcoming: boolean;
	};

	type Props = {
		locale: Locale;
		d: Dictionary;
		sessions: MemberSessionCard[];
		weekSessions: MemberSessionCard[];
		weekStartIso: string;
		initialView: 'list' | 'calendar';
		bookings: MemberBookingCard[];
	};

	let {
		locale,
		d,
		sessions,
		weekSessions,
		weekStartIso,
		initialView,
		bookings
	}: Props = $props();

	let mineOnly = $state(false);
	let pending = $state(false);
	let pendingNav = $state(false);

	const labels = $derived(d.member);
	const classLabels = $derived(d.classes);
	const a11y = $derived(d.a11y);
	const view = $derived(initialView);
	const loading = $derived(pendingNav);

	const weekStart = $derived(new Date(weekStartIso));
	const todayKey = $derived(new Date().toDateString());
	const pagePath = $derived(page.url.pathname);

	const visibleDays = $derived(
		Array.from({ length: 7 }, (_, i) => addDays(new Date(weekStart), i))
	);

	const filteredList = $derived(
		mineOnly ? sessions.filter((s) => s.myBookingId) : sessions
	);

	const sessionsByDay = $derived.by(() => {
		const source = mineOnly ? weekSessions.filter((s) => s.myBookingId) : weekSessions;
		const map = new Map<string, MemberSessionCard[]>();
		for (const s of source) {
			const key = new Date(s.startsAt).toDateString();
			const list = map.get(key) ?? [];
			list.push(s);
			map.set(key, list);
		}
		for (const list of map.values()) {
			list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
		}
		return map;
	});

	const history = $derived(bookings.filter((b) => !b.upcoming));

	const iconActionBtn =
		'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50';

	function statusLabel(status: string) {
		switch (status) {
			case 'confirmed':
				return labels.statusConfirmed;
			case 'waitlisted':
				return labels.statusWaitlisted;
			case 'cancelled':
				return labels.statusCancelled;
			case 'attended':
				return labels.statusAttended;
			case 'no_show':
				return labels.statusNoShow;
			default:
				return status;
		}
	}

	function weekRangeLabel() {
		const end = addDays(new Date(weekStart), 6);
		const fmt = (day: Date) =>
			day.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
				month: 'short',
				day: 'numeric'
			});
		return `${fmt(weekStart)} – ${fmt(end)}`;
	}

	function weekParam(day: Date) {
		const y = day.getFullYear();
		const m = String(day.getMonth() + 1).padStart(2, '0');
		const dNum = String(day.getDate()).padStart(2, '0');
		return `${y}-${m}-${dNum}`;
	}

	async function selectView(next: 'list' | 'calendar') {
		if (next === view || pendingNav) return;
		pendingNav = true;
		try {
			const params = new URLSearchParams();
			if (next === 'calendar') {
				params.set('tab', 'calendar');
				params.set('week', weekParam(new Date(weekStartIso)));
			}
			const qs = params.toString();
			await goto(qs ? `${pagePath}?${qs}` : pagePath, {
				keepFocus: true,
				noScroll: true,
				invalidateAll: true
			});
		} finally {
			pendingNav = false;
		}
	}

	async function goWeek(delta: number) {
		if (pendingNav) return;
		pendingNav = true;
		try {
			const next = addDays(new Date(weekStart), delta * 7);
			const params = new URLSearchParams({
				tab: 'calendar',
				week: weekParam(startOfWeekMonday(next))
			});
			await goto(`${pagePath}?${params.toString()}`, {
				keepFocus: true,
				noScroll: true,
				invalidateAll: true
			});
		} finally {
			pendingNav = false;
		}
	}

	function formatTime(iso: string) {
		try {
			return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
				hour: '2-digit',
				minute: '2-digit'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}

	function enhanceBooking() {
		pending = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			pending = false;
			await update();
		};
	}
</script>

{#snippet sessionCard(s: MemberSessionCard)}
	{@const full = s.capacity != null && s.confirmedCount >= s.capacity}
	{@const seats = s.capacity == null ? '∞' : `${s.confirmedCount}/${s.capacity}`}
	{@const reserved = Boolean(
		s.myBookingId && (s.myStatus === 'confirmed' || s.myStatus === 'waitlisted')
	)}
	<li
		class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm {reserved
			? 'ring-1 ring-[var(--color-primary)]/25'
			: ''}"
	>
		<div class="min-w-0">
			<p class="font-semibold text-[var(--color-text)]">{s.className}</p>
			<p class="text-xs text-[var(--color-muted)]">{formatSessionTime(s.startsAt, locale)}</p>
			<p class="mt-1 text-xs text-[var(--color-muted)]">
				{labels.seats}: {seats}{s.waitlistCount > 0 ? ` · ${labels.waitlist}: ${s.waitlistCount}` : ''}
			</p>
			{#if s.myStatus}
				<p class="mt-1.5 text-xs font-semibold text-[var(--color-primary)]">
					{statusLabel(s.myStatus)}
				</p>
			{/if}
		</div>

		<div class="flex w-full justify-center sm:justify-end">
			{#if reserved}
				<form method="POST" action="?/cancel" class="w-full max-w-xs sm:w-auto" use:enhance={enhanceBooking}>
					<input type="hidden" name="locale" value={locale} />
					<input type="hidden" name="booking_id" value={s.myBookingId} />
					<Button
						type="submit"
						variant="toolbarSecondary"
						disabled={pending}
						class="mx-auto w-full sm:mx-0 sm:min-w-[9rem]"
					>
						{labels.cancel}
					</Button>
				</form>
			{:else if !s.myStatus}
				<form method="POST" action="?/book" class="w-full max-w-xs sm:w-auto" use:enhance={enhanceBooking}>
					<input type="hidden" name="locale" value={locale} />
					<input type="hidden" name="session_id" value={s.id} />
					<Button type="submit" variant="toolbar" disabled={pending} class="w-full sm:min-w-[9rem]">
						{full ? labels.joinWaitlist : labels.book}
					</Button>
				</form>
			{/if}
		</div>
	</li>
{/snippet}

{#snippet calendarAction(s: MemberSessionCard)}
	{@const full = s.capacity != null && s.confirmedCount >= s.capacity}
	{#if s.myBookingId && (s.myStatus === 'confirmed' || s.myStatus === 'waitlisted')}
		<form method="POST" action="?/cancel" use:enhance={enhanceBooking}>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="booking_id" value={s.myBookingId} />
			<button
				type="submit"
				class="{iconActionBtn} border-[var(--color-danger)]/35 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
				aria-label={a11y.cancelClass}
				disabled={pending}
			>
				<X class="h-4 w-4" aria-hidden="true" />
			</button>
		</form>
	{:else if !s.myStatus}
		<form method="POST" action="?/book" use:enhance={enhanceBooking}>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="session_id" value={s.id} />
			<button
				type="submit"
				class="{iconActionBtn} border-[var(--color-primary)]/35 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
				aria-label={full ? a11y.joinWaitlist : a11y.bookClass}
				disabled={pending}
			>
				{#if full}
					<ListPlus class="h-4 w-4" aria-hidden="true" />
				{:else}
					<CalendarPlus class="h-4 w-4" aria-hidden="true" />
				{/if}
			</button>
		</form>
	{/if}
{/snippet}

<div class="flex flex-col gap-5">
	<div
		role="tablist"
		aria-label={labels.classes}
		class="flex w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5"
	>
		{#each [
			{ id: 'list' as const, label: classLabels.tabCatalog, Icon: List },
			{ id: 'calendar' as const, label: classLabels.tabCalendar, Icon: CalendarDays }
		] as item (item.id)}
			{@const selected = view === item.id}
			<button
				type="button"
				role="tab"
				aria-selected={selected}
				id={`member-classes-view-${item.id}`}
				tabindex={selected ? 0 : -1}
				disabled={loading}
				onclick={() => selectView(item.id)}
				class="inline-flex h-11 min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-60 {selected
					? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
					: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
			>
				<item.Icon class="h-4 w-4 shrink-0" aria-hidden="true" />
				<span>{item.label}</span>
			</button>
		{/each}
	</div>

	<div
		role="group"
		aria-label={labels.myBookings}
		class="flex w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5"
	>
		{#each [
			{ id: false, label: labels.filterAll },
			{ id: true, label: labels.filterMine }
		] as item (String(item.id))}
			{@const selected = mineOnly === item.id}
			<button
				type="button"
				aria-pressed={selected}
				disabled={loading}
				onclick={() => (mineOnly = item.id)}
				class="inline-flex h-10 min-h-10 flex-1 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-60 {selected
					? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
					: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
			>
				{item.label}
			</button>
		{/each}
	</div>

	<div role="tabpanel" aria-labelledby={`member-classes-view-${view}`} class="min-w-0">
		{#if loading}
			<PageLoader label={classLabels.loading} />
		{:else if view === 'list'}
			{#if filteredList.length === 0}
				<p class="text-sm text-[var(--color-muted)]">
					{mineOnly ? labels.emptyMyBookings : labels.emptySessions}
				</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each filteredList as s (s.id)}
						{@render sessionCard(s)}
					{/each}
				</ul>
			{/if}
		{:else}
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between gap-2">
					<button
						type="button"
						onclick={() => goWeek(-1)}
						disabled={loading}
						class="inline-flex h-10 min-h-10 items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 text-sm disabled:opacity-50"
					>
						<ChevronLeft class="h-4 w-4" aria-hidden="true" />
						{classLabels.prevWeek}
					</button>
					<p class="text-sm font-semibold text-[var(--color-text)]">{weekRangeLabel()}</p>
					<button
						type="button"
						onclick={() => goWeek(1)}
						disabled={loading}
						class="inline-flex h-10 min-h-10 items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 text-sm disabled:opacity-50"
					>
						{classLabels.nextWeek}
						<ChevronRight class="h-4 w-4" aria-hidden="true" />
					</button>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each visibleDays as day (day.toISOString())}
						{@const dayKey = day.toDateString()}
						{@const list = sessionsByDay.get(dayKey) ?? []}
						{@const isToday = dayKey === todayKey}
						<section
							class="flex min-h-0 flex-col rounded-xl border bg-[var(--color-surface)] p-3 {isToday
								? 'border-[var(--color-primary)]/50 ring-1 ring-[var(--color-primary)]/20'
								: 'border-[var(--color-border)]'}"
						>
							<header class="mb-2 flex items-center justify-between gap-2">
								<span class="text-sm font-bold text-[var(--color-text)]">
									{day.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
										weekday: 'short',
										month: 'short',
										day: 'numeric'
									})}
								</span>
								{#if isToday}
									<span
										class="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary-on)]"
									>
										{labels.today}
									</span>
								{/if}
							</header>
							{#if list.length === 0}
								<p class="py-2 text-xs text-[var(--color-muted)]">—</p>
							{:else}
								<ul class="flex flex-col gap-1.5">
									{#each list as s (s.id)}
										<li
											class="flex items-start justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-2 {s.myBookingId
												? 'ring-1 ring-[var(--color-primary)]/20'
												: ''}"
										>
											<div class="min-w-0 flex-1">
												<p class="truncate text-sm font-semibold text-[var(--color-text)]">
													{s.className}
												</p>
												<p class="text-xs text-[var(--color-muted)]">{formatTime(s.startsAt)}</p>
												{#if s.myStatus}
													<p class="mt-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
														{statusLabel(s.myStatus)}
													</p>
												{/if}
											</div>
											{@render calendarAction(s)}
										</li>
									{/each}
								</ul>
							{/if}
						</section>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	{#if !loading && history.length > 0}
		<section>
			<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
				{labels.history}
			</h2>
			<ul class="flex flex-col gap-2">
				{#each history as b (b.id)}
					<li class="rounded-xl border border-[var(--color-border)]/60 px-4 py-3 opacity-80">
						<p class="font-medium">{b.className}</p>
						<p class="text-xs text-[var(--color-muted)]">
							{formatSessionTime(b.startsAt, locale)} · {statusLabel(b.status)}
						</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
