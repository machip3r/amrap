<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		Clock3,
		QrCode,
		Keyboard,
		MonitorSmartphone
	} from '@lucide/svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { MemberMonthCheckIn } from '$lib/checkin/queries';

	export type CheckInCalendarLabels = {
		calendarPrev: string;
		calendarNext: string;
		calendarToday: string;
		checkInsOnDay: string;
		noCheckInsOnDay: string;
		noCheckInsMonth: string;
		visitsThisMonth: string;
		visitsLabel: string;
		daysPresent: string;
		daysPresentHint: string;
		bySource: string;
		selectedDayTitle: string;
		visitCount: string;
		sourceQr: string;
		sourceManual: string;
		sourceKiosk: string;
	};

	type Props = {
		locale: Locale;
		year: number;
		month: number;
		checkIns: MemberMonthCheckIn[];
		labels: CheckInCalendarLabels;
		baseHref: string;
	};

	let { locale, year, month, checkIns, labels, baseHref }: Props = $props();

	type SourceIcon = typeof QrCode;

	function sourceMeta(source: string): { label: string; Icon: SourceIcon } {
		const s = source.toUpperCase();
		if (s === 'QR') return { label: labels.sourceQr, Icon: QrCode };
		if (s === 'MANUAL') return { label: labels.sourceManual, Icon: Keyboard };
		if (s === 'KIOSK') return { label: labels.sourceKiosk, Icon: MonitorSmartphone };
		return { label: source, Icon: Clock3 };
	}

	function padMonth(n: number) {
		return String(n).padStart(2, '0');
	}

	function monthHref(y: number, m: number) {
		return `${baseHref}?month=${y}-${padMonth(m)}`;
	}

	function shiftMonth(y: number, m: number, delta: number) {
		const d = new Date(y, m - 1 + delta, 1);
		return { year: d.getFullYear(), month: d.getMonth() + 1 };
	}

	const byDay = $derived.by(() => {
		const map = new Map<number, MemberMonthCheckIn[]>();
		for (const c of checkIns) {
			const day = new Date(c.checkedInAt).getDate();
			const list = map.get(day) ?? [];
			list.push(c);
			map.set(day, list);
		}
		return map;
	});

	const sourceCounts = $derived.by(() => {
		let qr = 0;
		let manual = 0;
		let kiosk = 0;
		for (const c of checkIns) {
			const s = c.source.toUpperCase();
			if (s === 'QR') qr += 1;
			else if (s === 'MANUAL') manual += 1;
			else if (s === 'KIOSK') kiosk += 1;
		}
		return { qr, manual, kiosk };
	});

	const daysPresent = $derived(byDay.size);

	let selectedDay = $state<number | null>(null);

	$effect(() => {
		const today = new Date();
		if (today.getFullYear() === year && today.getMonth() + 1 === month) {
			selectedDay = today.getDate();
			return;
		}
		const first = [...byDay.keys()].sort((a, b) => a - b)[0];
		selectedDay = first ?? null;
	});

	const firstWeekday = $derived(new Date(year, month - 1, 1).getDay());
	const daysInMonth = $derived(new Date(year, month, 0).getDate());
	const prev = $derived(shiftMonth(year, month, -1));
	const next = $derived(shiftMonth(year, month, 1));
	const now = new Date();
	const isCurrentMonth = $derived(now.getFullYear() === year && now.getMonth() + 1 === month);

	const weekdayLabels = $derived.by(() => {
		const base = new Date(2024, 0, 7);
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(base);
			d.setDate(base.getDate() + i);
			return d.toLocaleDateString(locale, { weekday: 'short' });
		});
	});

	const monthTitle = $derived(
		new Date(year, month - 1, 1).toLocaleDateString(locale, {
			month: 'long',
			year: 'numeric'
		})
	);

	const selectedList = $derived(selectedDay != null ? (byDay.get(selectedDay) ?? []) : []);

	const selectedDateLabel = $derived(
		selectedDay != null
			? new Date(year, month - 1, selectedDay).toLocaleDateString(locale, {
					weekday: 'long',
					day: 'numeric',
					month: 'long'
				})
			: ''
	);

	const cells = $derived.by(() => {
		const out: (number | null)[] = [];
		for (let i = 0; i < firstWeekday; i++) out.push(null);
		for (let d = 1; d <= daysInMonth; d++) out.push(d);
		return out;
	});

	const sourceRows = $derived(
		[
			{ key: 'qr', count: sourceCounts.qr, ...sourceMeta('QR') },
			{ key: 'manual', count: sourceCounts.manual, ...sourceMeta('MANUAL') },
			{ key: 'kiosk', count: sourceCounts.kiosk, ...sourceMeta('KIOSK') }
		].filter((r) => r.count > 0)
	);
</script>

<div class="flex flex-col gap-5">
	<div class="grid gap-3 sm:grid-cols-3">
		<div
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
		>
			<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
				{labels.visitsLabel}
			</p>
			<p class="font-title mt-2 text-3xl font-bold tabular-nums text-[var(--color-text)]">
				{checkIns.length}
			</p>
			<p class="mt-1 text-xs text-[var(--color-muted)]">
				{labels.visitsThisMonth.replace('{count}', String(checkIns.length))}
			</p>
		</div>
		<div
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
		>
			<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
				{labels.daysPresentHint}
			</p>
			<p class="font-title mt-2 text-3xl font-bold tabular-nums text-[var(--color-text)]">
				{daysPresent}
			</p>
			<p class="mt-1 text-xs text-[var(--color-muted)]">
				{labels.daysPresent.replace('{count}', String(daysPresent))}
			</p>
		</div>
		<div
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
		>
			<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
				{labels.bySource}
			</p>
			{#if sourceRows.length === 0}
				<p class="mt-3 text-sm text-[var(--color-muted)]">—</p>
			{:else}
				<ul class="mt-3 flex flex-col gap-1.5">
					{#each sourceRows as row (row.key)}
						{@const Icon = row.Icon}
						<li class="flex items-center justify-between gap-2 text-sm">
							<span class="inline-flex items-center gap-1.5 text-[var(--color-text)]">
								<Icon class="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden="true" />
								{row.label}
							</span>
							<span class="tabular-nums font-semibold text-[var(--color-text)]">{row.count}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<div class="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
		<section
			class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3"
			>
				<div class="flex items-center gap-2">
					<a
						href={monthHref(prev.year, prev.month)}
						class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
						aria-label={labels.calendarPrev}
					>
						<ChevronLeft class="h-4 w-4" aria-hidden="true" />
					</a>
					<h2
						class="min-w-[9rem] text-center font-title text-base font-bold capitalize text-[var(--color-text)] sm:text-lg"
					>
						{monthTitle}
					</h2>
					<a
						href={monthHref(next.year, next.month)}
						class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
						aria-label={labels.calendarNext}
					>
						<ChevronRight class="h-4 w-4" aria-hidden="true" />
					</a>
				</div>
				{#if !isCurrentMonth}
					<a
						href={monthHref(now.getFullYear(), now.getMonth() + 1)}
						class="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)]"
					>
						{labels.calendarToday}
					</a>
				{/if}
			</div>

			<div
				class="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/40"
			>
				{#each weekdayLabels as w (w)}
					<div
						class="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] sm:text-[11px]"
					>
						{w}
					</div>
				{/each}
			</div>
			<div class="grid grid-cols-7">
				{#each cells as day, i (day == null ? `e-${i}` : day)}
					{#if day == null}
						<div
							class="min-h-[3.5rem] border-b border-r border-[var(--color-border)]/50 bg-[var(--color-bg)]/40"
						></div>
					{:else}
						{@const count = byDay.get(day)?.length ?? 0}
						{@const selected = selectedDay === day}
						{@const isToday = isCurrentMonth && now.getDate() === day}
						<button
							type="button"
							onclick={() => (selectedDay = day)}
							class="relative min-h-14 border-b border-r border-[var(--color-border)]/50 p-1.5 text-left transition-colors {selected
								? 'bg-[var(--color-primary)]/12'
								: 'hover:bg-[var(--color-surface-hover)]/60'}"
						>
							<span
								class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold {isToday
									? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
									: count > 0
										? 'text-[var(--color-text)]'
										: 'text-[var(--color-muted)]'}"
							>
								{day}
							</span>
							{#if count > 0}
								<span
									class="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1"
								>
									<span class="flex gap-0.5">
										{#each Array.from({ length: Math.min(count, 3) }) as _, j (j)}
											<span class="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"></span>
										{/each}
									</span>
									{#if count > 3}
										<span
											class="text-[10px] font-semibold tabular-nums text-[var(--color-primary)]"
										>
											+{count - 3}
										</span>
									{/if}
								</span>
							{/if}
						</button>
					{/if}
				{/each}
			</div>
		</section>

		<section
			class="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
		>
			<div class="border-b border-[var(--color-border)] px-5 py-4">
				<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
					{labels.selectedDayTitle}
				</p>
				<h3 class="mt-1 font-title text-lg font-bold capitalize text-[var(--color-text)]">
					{selectedDateLabel || '—'}
				</h3>
				{#if selectedDay != null}
					<p class="mt-1 text-sm text-[var(--color-muted)]">
						{labels.visitCount.replace('{count}', String(selectedList.length))}
					</p>
				{/if}
			</div>

			<div class="flex flex-1 flex-col p-4">
				{#if checkIns.length === 0}
					<p class="py-8 text-center text-sm text-[var(--color-muted)]">
						{labels.noCheckInsMonth}
					</p>
				{:else if selectedDay == null || selectedList.length === 0}
					<p class="py-8 text-center text-sm text-[var(--color-muted)]">
						{labels.noCheckInsOnDay}
					</p>
				{:else}
					<ol class="relative flex flex-col gap-0 border-l border-[var(--color-border)] pl-4">
						{#each selectedList as c, index (c.id)}
							{@const meta = sourceMeta(c.source)}
							{@const Icon = meta.Icon}
							<li class="relative pb-4 last:pb-0">
								<span
									class="absolute -left-[1.28rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-primary)]"
								></span>
								<div class="rounded-xl bg-[var(--color-bg)] px-3 py-2.5">
									<div class="flex items-center justify-between gap-2">
										<p
											class="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-[var(--color-text)]"
										>
											<Clock3 class="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden="true" />
											{new Date(c.checkedInAt).toLocaleTimeString(locale, {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</p>
										<span class="text-[11px] font-medium text-[var(--color-muted)]">
											#{index + 1}
										</span>
									</div>
									<p
										class="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]"
									>
										<Icon class="h-3.5 w-3.5" aria-hidden="true" />
										{meta.label}
									</p>
								</div>
							</li>
						{/each}
					</ol>
				{/if}
			</div>
		</section>
	</div>
</div>
