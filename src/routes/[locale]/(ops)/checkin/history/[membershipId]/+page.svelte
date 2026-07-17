<script lang="ts">
	import { ArrowLeft, ArrowRight, Mail, Phone, CreditCard } from '@lucide/svelte';
	import CheckinMonthCalendar from '$lib/components/checkin/CheckinMonthCalendar.svelte';

	let { data } = $props();
	const d = $derived(data.d);
	const locale = $derived(data.locale);
	const member = $derived(data.memberMonth);

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
		return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
	}

	const active = $derived(
		member.expiresAt != null && new Date(member.expiresAt).getTime() > Date.now()
	);
</script>

<svelte:head>
	<title>{member.memberName} — {d.checkin.calendarTitle} — AMRAP</title>
</svelte:head>

<div class="animate-fade-in-up mx-auto flex w-full max-w-6xl flex-col gap-5 pb-4">
	<a
		href={`/${locale}/checkin/history`}
		class="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
	>
		<ArrowLeft class="h-4 w-4" aria-hidden="true" />
		{d.checkin.backToHistory}
	</a>

	<section
		class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	>
		<div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex min-w-0 items-start gap-4">
				<span
					class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-base font-bold text-[var(--color-primary)]"
				>
					{initials(member.memberName)}
				</span>
				<div class="min-w-0">
					<p class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
						{d.checkin.calendarTitle}
					</p>
					<h1
						class="font-title truncate text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl"
					>
						{member.memberName}
					</h1>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.checkin.calendarSubtitle}</p>
					<div class="mt-3 flex flex-wrap gap-2">
						<span
							class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide {active
								? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
								: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'}"
						>
							{active ? d.checkin.active : d.checkin.expired}
						</span>
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text)]"
						>
							<CreditCard class="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden="true" />
							{member.planName ?? d.checkin.noPlan}
						</span>
					</div>
				</div>
			</div>

			{#if data.canOpenMember}
				<a
					href={`/${locale}/members/${member.membershipId}`}
					class="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] transition-[filter] hover:brightness-[0.92]"
				>
					{d.checkin.viewMemberProfile}
					<ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
				</a>
			{/if}
		</div>

		<dl class="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-5 sm:grid-cols-2">
			<div class="rounded-xl bg-[var(--color-bg)] px-4 py-3">
				<dt
					class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]"
				>
					<Mail class="h-3.5 w-3.5" aria-hidden="true" />
					{d.members.email}
				</dt>
				<dd class="mt-1 truncate text-sm font-medium text-[var(--color-text)]">
					{member.email ?? '—'}
				</dd>
			</div>
			<div class="rounded-xl bg-[var(--color-bg)] px-4 py-3">
				<dt
					class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]"
				>
					<Phone class="h-3.5 w-3.5" aria-hidden="true" />
					{d.members.phone}
				</dt>
				<dd class="mt-1 truncate text-sm font-medium text-[var(--color-text)]">
					{member.phone ?? '—'}
				</dd>
			</div>
		</dl>
	</section>

	<CheckinMonthCalendar
		{locale}
		year={member.year}
		month={member.month}
		checkIns={member.checkIns}
		baseHref={data.baseHref}
		labels={{
			calendarPrev: d.checkin.calendarPrev,
			calendarNext: d.checkin.calendarNext,
			calendarToday: d.checkin.calendarToday,
			checkInsOnDay: d.checkin.checkInsOnDay,
			noCheckInsOnDay: d.checkin.noCheckInsOnDay,
			noCheckInsMonth: d.checkin.noCheckInsMonth,
			visitsThisMonth: d.checkin.visitsThisMonth,
			visitsLabel: d.checkin.visitsLabel,
			daysPresent: d.checkin.daysPresent,
			daysPresentHint: d.checkin.daysPresentHint,
			bySource: d.checkin.bySource,
			selectedDayTitle: d.checkin.selectedDayTitle,
			visitCount: d.checkin.visitCount,
			sourceQr: d.checkin.sourceQr,
			sourceManual: d.checkin.sourceManual,
			sourceKiosk: d.checkin.sourceKiosk
		}}
	/>
</div>
