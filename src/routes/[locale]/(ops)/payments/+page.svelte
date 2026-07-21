<script lang="ts">
	import Banknote from '@lucide/svelte/icons/banknote';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Wallet from '@lucide/svelte/icons/wallet';
	import PaymentsList from '$lib/components/payments/PaymentsList.svelte';
	import RegisterPaymentDialog from '$lib/components/payments/RegisterPaymentDialog.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);

	let highlightId = $state<string | null>(null);
	let clearTimer: ReturnType<typeof setTimeout> | null = null;

	function flashRow(paymentId: string) {
		if (clearTimer != null) clearTimeout(clearTimer);
		highlightId = paymentId;
		clearTimer = setTimeout(() => {
			highlightId = null;
			clearTimer = null;
		}, 3000);
	}

	function formatAmount(amount: number) {
		try {
			return new Intl.NumberFormat(data.locale, {
				style: 'currency',
				currency: 'MXN',
				maximumFractionDigits: amount % 1 === 0 ? 0 : 2
			}).format(amount);
		} catch {
			return String(amount);
		}
	}

	function withCount(template: string, count: number) {
		return template.replace('{count}', String(count));
	}
</script>

<svelte:head>
	<title>{d.payments.title} — AMRAP</title>
</svelte:head>

{#if data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="flex w-full animate-fade-in-up flex-col gap-5">
		{#if data.listError}
			<p
				class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
				role="alert"
			>
				{d.payments.error}
			</p>
		{/if}

		<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
					{d.payments.title}
				</h1>
				<p class="mt-1 text-sm text-[var(--color-muted)]">{d.payments.subtitle}</p>
				{#if data.members.length === 0}
					<p class="mt-2 text-sm text-[var(--color-muted)]">{d.payments.noMembers}</p>
				{/if}
			</div>
			<RegisterPaymentDialog
				locale={data.locale}
				{d}
				members={data.members}
				plans={data.plans}
				dayPassPrice={data.dayPassPrice}
				canManageMembers={data.canManageMembers}
				onSuccess={flashRow}
			/>
		</header>

		<div class="grid grid-cols-2 gap-3">
			<div
				class="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
			>
				<div class="absolute left-0 top-0 h-1 w-16 rounded-br-md bg-[var(--color-primary)]"></div>
				<div class="flex items-start justify-between gap-3">
					<span class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
						{d.payments.statMonth}
					</span>
					<span
						class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
					>
						<Wallet class="h-4 w-4" aria-hidden="true" />
					</span>
				</div>
				<p
					class="font-title mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl"
				>
					{formatAmount(data.stats.monthTotal)}
				</p>
				<p class="mt-2 text-xs font-medium text-[var(--color-muted)]">
					{withCount(d.payments.statMonthHint, data.stats.monthCount)}
				</p>
			</div>

			<div
				class="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
			>
				<div class="absolute left-0 top-0 h-1 w-16 rounded-br-md bg-[var(--color-success)]"></div>
				<div class="flex items-start justify-between gap-3">
					<span class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
						{d.payments.statToday}
					</span>
					<span
						class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-success)]/15 text-[var(--color-success)]"
					>
						<CalendarDays class="h-4 w-4" aria-hidden="true" />
					</span>
				</div>
				<p
					class="font-title mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl"
				>
					{formatAmount(data.stats.todayTotal)}
				</p>
				<p class="mt-2 text-xs font-medium text-[var(--color-muted)]">
					{withCount(d.payments.statTodayHint, data.stats.todayCount)}
				</p>
			</div>

			<div
				class="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
			>
				<div class="absolute left-0 top-0 h-1 w-16 rounded-br-md bg-[var(--color-muted)]"></div>
				<div class="flex items-start justify-between gap-3">
					<span class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
						{d.payments.statPlans}
					</span>
					<span
						class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-muted)]/15 text-[var(--color-muted)]"
					>
						<Banknote class="h-4 w-4" aria-hidden="true" />
					</span>
				</div>
				<p
					class="font-title mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl"
				>
					{formatAmount(data.stats.plansTotal)}
				</p>
				<p class="mt-2 text-xs font-medium text-[var(--color-muted)]">
					{withCount(d.payments.statPlansHint, data.stats.plansCount)}
				</p>
			</div>

			<div
				class="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
			>
				<div class="absolute left-0 top-0 h-1 w-16 rounded-br-md bg-[var(--color-muted)]"></div>
				<div class="flex items-start justify-between gap-3">
					<span class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
						{d.payments.statDayPass}
					</span>
					<span
						class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-muted)]/15 text-[var(--color-muted)]"
					>
						<Ticket class="h-4 w-4" aria-hidden="true" />
					</span>
				</div>
				<p
					class="font-title mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl"
				>
					{formatAmount(data.stats.dayPassTotal)}
				</p>
				<p class="mt-2 text-xs font-medium text-[var(--color-muted)]">
					{withCount(d.payments.statDayPassHint, data.stats.dayPassCount)}
				</p>
			</div>
		</div>

		<PaymentsList
			locale={data.locale}
			payments={data.payments}
			meta={data.meta}
			q={data.q}
			{highlightId}
			labels={{
				date: d.payments.date,
				member: d.payments.member,
				amount: d.payments.amount,
				method: d.payments.method,
				concept: d.payments.kindLabel,
				noPayments: d.payments.noPayments,
				noResults: d.payments.noResults,
				searchPlaceholder: d.payments.searchPlaceholder,
				reload: d.payments.reload,
				showing: d.payments.showing,
				newBadge: d.payments.newBadge,
				previous: d.common.previous,
				next: d.common.next
			}}
		/>
	</div>
{/if}
