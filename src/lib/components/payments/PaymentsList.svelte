<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Search from '@lucide/svelte/icons/search';
	import Input from '$lib/components/ui/Input.svelte';
	import TablePagination from '$lib/components/ui/TablePagination.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { PageMeta } from '$lib/pagination';
	import type { PaymentKind } from '$lib/types';
	import { LIMITS, sanitizeSearchInput } from '$lib/validation/schemas';

	export type PaymentListItem = {
		id: string;
		memberName: string;
		amount: number;
		methodLabel: string;
		createdAt: string;
		kind: PaymentKind;
		kindLabel: string;
		planName: string | null;
	};

	export type PaymentsListLabels = {
		date: string;
		member: string;
		amount: string;
		method: string;
		concept: string;
		noPayments: string;
		noResults: string;
		searchPlaceholder: string;
		reload: string;
		showing: string;
		newBadge: string;
		previous: string;
		next: string;
	};

	type Props = {
		locale: Locale;
		payments: PaymentListItem[];
		labels: PaymentsListLabels;
		meta: PageMeta;
		q: string;
		highlightId?: string | null;
	};

	let { locale, payments, labels, meta, q: initialQ, highlightId = null }: Props = $props();

	let query = $state('');
	let pending = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		query = initialQ;
	});

	$effect(() => {
		if (!highlightId) return;
		const scrollTimer = window.setTimeout(() => {
			document
				.getElementById(`payment-row-${highlightId}`)
				?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 80);
		return () => window.clearTimeout(scrollTimer);
	});

	const emptyMessage = $derived(
		meta.total === 0 && !initialQ ? labels.noPayments : labels.noResults
	);

	const pathname = $derived(`/${locale}/payments`);

	function hrefFor(overrides: Record<string, string | null | undefined>, pageNum?: number) {
		const merged: Record<string, string | undefined> = {
			q: initialQ || undefined
		};
		for (const [key, value] of Object.entries(overrides)) {
			if (value == null || value === '') delete merged[key];
			else merged[key] = value;
		}
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(merged)) {
			if (key === 'page') continue;
			if (value != null && value !== '') params.set(key, value);
		}
		const page = pageNum ?? meta.page;
		if (page > 1) params.set('page', String(page));
		const qs = params.toString();
		return qs ? `${pathname}?${qs}` : pathname;
	}

	function pushQuery(nextQ: string) {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(async () => {
			pending = true;
			await goto(hrefFor({ q: nextQ.trim() || null }, 1), {
				keepFocus: true,
				noScroll: true,
				invalidateAll: true
			});
			pending = false;
		}, 300);
	}

	async function reload() {
		pending = true;
		await invalidateAll();
		pending = false;
	}

	function formatAmount(amount: number) {
		try {
			return new Intl.NumberFormat(locale, {
				style: 'currency',
				currency: 'MXN',
				maximumFractionDigits: 2
			}).format(amount);
		} catch {
			return String(amount);
		}
	}

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleString(locale, {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative min-w-0 flex-1">
				<label class="sr-only" for="payments-search">{labels.searchPlaceholder}</label>
				<Search
					class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
					aria-hidden="true"
				/>
				<Input
					id="payments-search"
					name="q"
					type="search"
					class="pl-10"
					maxlength={LIMITS.search}
					placeholder={labels.searchPlaceholder}
					bind:value={query}
					oninput={(e) => {
						const value = sanitizeSearchInput((e.currentTarget as HTMLInputElement).value);
						query = value;
						pushQuery(value);
					}}
				/>
			</div>
			<button
				type="button"
				onclick={reload}
				disabled={pending}
				class="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
				aria-label={labels.reload}
				title={labels.reload}
			>
				<RefreshCw class="h-4 w-4 {pending ? 'animate-spin' : ''}" aria-hidden="true" />
			</button>
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[42rem] border-collapse text-left text-sm">
				<thead>
					<tr
						class="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]"
					>
						<th class="px-4 py-3 sm:px-5">{labels.date}</th>
						<th class="px-4 py-3">{labels.member}</th>
						<th class="px-4 py-3">{labels.concept}</th>
						<th class="px-4 py-3">{labels.amount}</th>
						<th class="px-4 py-3 pr-5">{labels.method}</th>
					</tr>
				</thead>
				<tbody>
					{#if payments.length === 0}
						<tr>
							<td colspan="5" class="px-5 py-12 text-center text-[var(--color-muted)]">
								{emptyMessage}
							</td>
						</tr>
					{:else}
						{#each payments as p (p.id)}
							{@const isNew = highlightId === p.id}
							<tr
								id="payment-row-{p.id}"
								class="border-b border-[var(--color-border)]/70 transition-colors last:border-b-0 hover:bg-[var(--color-surface-hover)]/40 {isNew
									? 'amrap-row-shine'
									: ''}"
							>
								<td class="px-4 py-3.5 tabular-nums text-[var(--color-text)] sm:px-5">
									{formatDate(p.createdAt)}
								</td>
								<td class="px-4 py-3.5 font-semibold text-[var(--color-text)]">
									{p.memberName}
									{#if isNew}
										<span class="ml-2 text-[11px] font-medium text-[var(--color-primary)]">
											{labels.newBadge}
										</span>
									{/if}
								</td>
								<td class="px-4 py-3.5">
									<span
										class="inline-flex max-w-full flex-col gap-0.5 rounded-md px-2 py-0.5 text-xs font-semibold {p.kind ===
										'day_pass'
											? 'bg-[var(--color-muted)]/15 text-[var(--color-text)]'
											: 'bg-[var(--color-primary-soft)] text-[var(--color-text)]'}"
									>
										<span class="truncate">{p.kindLabel}</span>
										{#if p.planName}
											<span class="truncate font-medium text-[var(--color-muted)]">{p.planName}</span>
										{/if}
									</span>
								</td>
								<td class="px-4 py-3.5 tabular-nums font-semibold text-[var(--color-text)]">
									{formatAmount(p.amount)}
								</td>
								<td class="px-4 py-3.5 pr-5">
									<span
										class="inline-flex rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text)]"
									>
										{p.methodLabel}
									</span>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<TablePagination
			{meta}
			href={pathname}
			searchParams={{ q: initialQ || undefined }}
			labels={{
				showing: labels.showing,
				previous: labels.previous,
				next: labels.next
			}}
		/>
	</div>
</div>
