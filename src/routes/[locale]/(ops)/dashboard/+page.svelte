<script lang="ts">
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Layers from '@lucide/svelte/icons/layers';
	import Timer from '@lucide/svelte/icons/timer';
	import Users from '@lucide/svelte/icons/users';
	import DashboardQuickActions from '$lib/components/dashboard/DashboardQuickActions.svelte';
	import { brandedTitle } from '$lib/seo/document-title';

	let { data } = $props();
	const dash = $derived(data.dashboard);
	const d = $derived(data.d);
	const locale = $derived(data.locale);
</script>

<svelte:head>
	<title>{brandedTitle(d.dashboard.title, data.documentBrand)}</title>
</svelte:head>

{#snippet metricCard(
	label: string,
	value: number,
	hint: string,
	accent: 'primary' | 'success' | 'danger'
)}
	{@const accentBar =
		accent === 'primary'
			? 'bg-[var(--color-primary)]'
			: accent === 'success'
				? 'bg-[var(--color-success)]'
				: 'bg-[var(--color-danger)]'}
	{@const hintColor =
		accent === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]'}
	<div
		class="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm sm:p-5"
	>
		<div class="absolute left-0 top-0 h-1 w-10 rounded-br-md sm:w-16 {accentBar}"></div>
		<span class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] sm:text-[11px]">
			{label}
		</span>
		<p class="font-title mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:mt-4 sm:text-4xl">
			{value}
		</p>
		<p class="mt-1 text-[10px] font-medium leading-snug {hintColor} sm:mt-2 sm:text-xs">{hint}</p>
	</div>
{/snippet}

{#if dash.kind === 'trainer'}
	{@const labels = dash.labels}
	<div class="animate-fade-in-up space-y-6 lg:space-y-8">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
			<div>
				<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
					{labels.titleTrainer}
				</h1>
				<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.subtitleTrainer}</p>
			</div>
			<div class="sm:text-right">
				<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
					{labels.dateLabel}
				</p>
				<p class="text-sm font-medium capitalize text-[var(--color-text)]">{dash.todayDate}</p>
			</div>
		</div>

		{#if dash.hero}
			<section
				class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
			>
				<div class="border-b border-[var(--color-border)] bg-[var(--color-primary)]/8 px-5 py-3 sm:px-6">
					<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
						{dash.hero.live ? labels.heroLive : labels.heroNext}
					</p>
				</div>
				<div
					class="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6"
				>
					<div class="min-w-0">
						<h2
							class="font-title text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl"
						>
							{dash.hero.class_name || '—'}
						</h2>
						<p class="mt-2 text-sm text-[var(--color-muted)]">
							{dash.hero.timeLabel} · {dash.coachLabel}
						</p>
						<p
							class="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-hover)] px-3 py-1 text-sm font-semibold tabular-nums text-[var(--color-text)]"
						>
							<Users class="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
							{dash.hero.confirmed_count ?? 0}/{dash.hero.capacity ?? '∞'}
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<a
							href="/{locale}/classes/{dash.hero.id}"
							class="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-on)] transition-colors hover:bg-[var(--color-primary-hover)]"
						>
							{labels.openRoster}
							<ArrowRight class="h-4 w-4" aria-hidden="true" />
						</a>
						<a
							href="/{locale}/timers"
							class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
						>
							<Timer class="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
							{labels.openTimers}
						</a>
					</div>
				</div>
			</section>
		{:else}
			<section
				class="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center shadow-sm"
			>
				<p class="text-sm text-[var(--color-muted)]">{labels.heroEmpty}</p>
				<div class="mt-4 flex flex-wrap justify-center gap-2">
					<a
						href="/{locale}/classes?tab=catalog"
						class="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
					>
						<Layers class="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
						{labels.quickNewClass}
					</a>
					<a
						href="/{locale}/timers"
						class="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
					>
						<Timer class="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
						{labels.openTimers}
					</a>
				</div>
			</section>
		{/if}

		<div>
			<p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
				{labels.weekStrip}
			</p>
			<div class="flex flex-row gap-2">
				{#each [{ label: labels.myClasses, value: dash.myClassesCount }, { label: labels.sessionsThisWeek, value: dash.sessionsThisWeek }, { label: labels.bookedThisWeek, value: dash.bookedThisWeek }] as pill (pill.label)}
					<div
						class="flex min-w-0 flex-1 flex-col justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2.5 shadow-sm sm:px-4 sm:py-3"
					>
						<p
							class="truncate text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)] sm:text-[11px]"
						>
							{pill.label}
						</p>
						<p
							class="font-title text-xl font-bold tabular-nums text-[var(--color-text)] sm:text-2xl"
						>
							{pill.value}
						</p>
					</div>
				{/each}
			</div>
		</div>

		<section
			class="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4"
			>
				<h2 class="font-title text-lg font-bold text-[var(--color-text)]">
					{labels.upcomingSessions}
				</h2>
				<a
					href="/{locale}/classes?tab=calendar"
					class="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
				>
					{labels.viewAll}
					<ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
				</a>
			</div>
			{#if dash.upcoming.length === 0}
				<p class="px-5 py-10 text-center text-sm text-[var(--color-muted)]">
					{labels.noUpcomingSessions}
				</p>
			{:else}
				<ul class="divide-y divide-[var(--color-border)]">
					{#each dash.upcoming as s (s.id)}
						<li>
							<a
								href="/{locale}/classes/{s.id}"
								class="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-hover)]/60"
							>
								<div class="min-w-0">
									<p class="truncate font-semibold text-[var(--color-text)]">{s.class_name}</p>
									<p class="mt-0.5 text-xs text-[var(--color-muted)]">
										{s.timeLabel} · {s.confirmed_count}/{s.capacity ?? '∞'}
									</p>
								</div>
								<ArrowRight
									class="h-4 w-4 shrink-0 text-[var(--color-primary)]"
									aria-hidden="true"
								/>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
{:else}
	{@const maxBar = Math.max(1, ...dash.weeklyDays.map((day) => day.count))}
	<div class="animate-fade-in-up space-y-6 lg:space-y-8">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
			<div>
				<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
					{d.dashboard.title}
				</h1>
				<p class="mt-1 text-sm text-[var(--color-muted)]">{d.dashboard.subtitle}</p>
			</div>
			<div class="sm:text-right">
				<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
					{d.dashboard.dateLabel}
				</p>
				<p class="text-sm font-medium capitalize text-[var(--color-text)]">{dash.todayDate}</p>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-2 sm:gap-4">
			{@render metricCard(
				d.dashboard.activeMembers,
				dash.activeCount,
				d.dashboard.activeMembersHint,
				'success'
			)}
			{@render metricCard(
				d.dashboard.checkInsToday,
				dash.checkInsToday,
				d.dashboard.checkInsTodayHint,
				'primary'
			)}
			{@render metricCard(
				d.dashboard.expiringSoon,
				dash.expiringCount,
				d.dashboard.expiringSoonHint,
				'danger'
			)}
		</div>

		<DashboardQuickActions
			{locale}
			canCheckIn={dash.canCheckIn}
			canManageMembers={dash.canManageMembers}
			canManageStaff={dash.canManageStaff}
			plans={dash.registerPlans}
			dayPassPrice={dash.dayPassPrice}
			labels={{
				quickActions: d.dashboard.quickActions,
				quickCheckIn: d.dashboard.quickCheckIn,
				quickNewMember: d.dashboard.quickNewMember,
				quickNewTrainer: d.dashboard.quickNewTrainer,
				quickNewStaff: d.dashboard.quickNewStaff
			}}
		/>

		<div class="grid gap-4 lg:grid-cols-3">
			<section
				class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm lg:col-span-2"
			>
				<div class="mb-6 flex items-center justify-between gap-3">
					<h2 class="font-title text-lg font-bold text-[var(--color-text)]">
						{d.dashboard.weeklyAttendance}
					</h2>
					<span
						class="rounded-full bg-[var(--color-surface-hover)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]"
					>
						{d.dashboard.last7Days}
					</span>
				</div>
				<div class="flex h-52 items-end justify-between gap-2 sm:gap-3">
					{#each dash.weeklyDays as day (day.label + String(day.isToday))}
						{@const heightPct = Math.max(8, Math.round((day.count / maxBar) * 100))}
						<div class="flex min-w-0 flex-1 flex-col items-center gap-2">
							<span class="text-[10px] font-semibold tabular-nums text-[var(--color-muted)]">
								{day.count}
							</span>
							<div class="flex h-40 w-full items-end justify-center">
								<div
									class="w-full max-w-10 rounded-t-md transition-colors {day.isToday
										? 'bg-[var(--color-primary)]'
										: 'bg-[var(--color-muted)]/25 dark:bg-[var(--color-muted)]/35'}"
									style="height: {heightPct}%"
									title="{day.label}: {day.count}"
								></div>
							</div>
							<span
								class="text-[11px] font-semibold {day.isToday
									? 'text-[var(--color-primary)]'
									: 'text-[var(--color-muted)]'}"
							>
								{day.label}
							</span>
						</div>
					{/each}
				</div>
			</section>

			<section
				class="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
			>
				<div class="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4">
					<AlertTriangle class="h-4 w-4 text-[var(--color-danger)]" aria-hidden="true" />
					<h2 class="font-title text-lg font-bold text-[var(--color-text)]">{d.dashboard.alerts}</h2>
				</div>
				<div class="flex flex-1 flex-col gap-2 p-4">
					{#if dash.alerts.length === 0}
						<p class="py-8 text-center text-sm text-[var(--color-muted)]">{d.dashboard.noAlerts}</p>
					{:else}
						{#each dash.alerts as alert (alert.kind + alert.id)}
							<a
								href="/{locale}/members/{alert.id}"
								class="rounded-lg border-l-4 border-l-[var(--color-danger)] bg-[var(--color-danger-bg)] px-3 py-2.5 transition-opacity hover:opacity-90"
							>
								<p
									class="text-xs font-bold uppercase tracking-wide text-[var(--color-danger)]"
								>
									{alert.kind === 'expired'
										? d.dashboard.alertExpired
										: d.dashboard.alertExpiring}
								</p>
								<p class="mt-0.5 text-sm font-semibold text-[var(--color-text)]">{alert.name}</p>
								<p
									class="mt-0.5 text-[11px] font-medium text-[var(--color-danger)] underline-offset-2"
								>
									{d.dashboard.alertActionRequired}
								</p>
							</a>
						{/each}
					{/if}
				</div>
				<div class="border-t border-[var(--color-border)] px-4 py-3">
					<a
						href="/{locale}/members"
						class="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition-opacity hover:opacity-80"
					>
						{d.dashboard.viewAllAlerts}
						<ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
					</a>
				</div>
			</section>
		</div>

		<section
			class="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4"
			>
				<div class="flex items-center gap-3">
					<h2 class="font-title text-lg font-bold text-[var(--color-text)]">
						{d.dashboard.accessLog}
					</h2>
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success)]/15 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-success)]"
					>
						<span class="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"></span>
						{d.dashboard.realtime}
					</span>
				</div>
				<a
					href="/{locale}/checkin"
					class="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
				>
					{d.dashboard.viewAll}
					<ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
				</a>
			</div>

			{#if dash.recentCheckIns.length === 0}
				<p class="px-5 py-10 text-center text-sm text-[var(--color-muted)]">
					<Users class="mx-auto mb-2 h-5 w-5 opacity-50" aria-hidden="true" />
					{d.dashboard.noCheckIns}
				</p>
			{:else}
				<!-- Mobile cards: member + status + action; plan/time secondary -->
				<ul class="flex flex-col divide-y divide-[var(--color-border)] sm:hidden">
					{#each dash.recentCheckIns as row (row.id)}
						<li class="flex items-center gap-3 px-4 py-3">
							<span
								class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]"
							>
								{row.initials}
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-medium text-[var(--color-text)]">{row.name}</p>
								<p class="mt-0.5 text-xs tabular-nums text-[var(--color-muted)]">{row.time}</p>
								<div class="mt-1.5 flex flex-wrap items-center gap-2">
									{#if row.status === 'ACTIVE'}
										<span
											class="inline-flex rounded-full bg-[var(--color-success)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-success)]"
										>
											{d.members.active}
										</span>
									{:else}
										<span
											class="inline-flex rounded-full bg-[var(--color-danger)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-danger)]"
										>
											{d.members.expired}
										</span>
									{/if}
									<span class="truncate text-xs text-[var(--color-muted)]">{row.planName}</span>
								</div>
							</div>
							{#if row.status === 'EXPIRED'}
								<a
									href="/{locale}/members/{row.membershipId}"
									class="inline-flex min-h-11 shrink-0 items-center rounded-md bg-[var(--color-primary)] px-3 text-xs font-semibold text-[var(--color-primary-on)]"
								>
									{d.dashboard.renew}
								</a>
							{:else}
								<a
									href="/{locale}/members/{row.membershipId}"
									class="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-[var(--color-primary)]"
								>
									{d.members.view}
								</a>
							{/if}
						</li>
					{/each}
				</ul>

				<!-- Desktop table -->
				<div class="hidden overflow-x-auto sm:block">
					<table class="w-full text-left text-sm">
						<thead>
							<tr
								class="border-b border-[var(--color-border)] text-[11px] uppercase tracking-wider text-[var(--color-muted)]"
							>
								<th class="px-5 py-3 font-semibold">{d.dashboard.colMember}</th>
								<th class="px-5 py-3 font-semibold">{d.dashboard.colTime}</th>
								<th class="px-5 py-3 font-semibold">{d.dashboard.colPlan}</th>
								<th class="px-5 py-3 font-semibold">{d.dashboard.colStatus}</th>
								<th class="px-5 py-3 text-right font-semibold">{d.dashboard.colAction}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[var(--color-border)]">
							{#each dash.recentCheckIns as row (row.id)}
								<tr class="hover:bg-[var(--color-surface-hover)]/60">
									<td class="px-5 py-3">
										<div class="flex items-center gap-3">
											<span
												class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]"
											>
												{row.initials}
											</span>
											<span class="font-medium text-[var(--color-text)]">{row.name}</span>
										</div>
									</td>
									<td class="px-5 py-3 tabular-nums text-[var(--color-muted)]">{row.time}</td>
									<td class="px-5 py-3 text-[var(--color-text)]">{row.planName}</td>
									<td class="px-5 py-3">
										{#if row.status === 'ACTIVE'}
											<span
												class="inline-flex rounded-full bg-[var(--color-success)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-success)]"
											>
												{d.members.active}
											</span>
										{:else}
											<span
												class="inline-flex rounded-full bg-[var(--color-danger)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-danger)]"
											>
												{d.members.expired}
											</span>
										{/if}
									</td>
									<td class="px-5 py-3 text-right">
										{#if row.status === 'EXPIRED'}
											<a
												href="/{locale}/members/{row.membershipId}"
												class="inline-flex rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-on)] transition-colors hover:bg-[var(--color-primary-hover)]"
											>
												{d.dashboard.renew}
											</a>
										{:else}
											<a
												href="/{locale}/members/{row.membershipId}"
												class="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
											>
												{d.members.view}
											</a>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<div class="border-t border-[var(--color-border)] px-5 py-3 text-center">
				<a
					href="/{locale}/checkin"
					class="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition-opacity hover:opacity-80"
				>
					{d.dashboard.viewFullHistory}
					<ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
				</a>
			</div>
		</section>
	</div>
{/if}
