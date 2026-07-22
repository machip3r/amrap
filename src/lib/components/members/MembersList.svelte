<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
	import { page } from '$app/state';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Search from '@lucide/svelte/icons/search';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { PageMeta } from '$lib/pagination';
	import type { Member } from '$lib/types';
	import { LIMITS, sanitizeSearchInput } from '$lib/validation/schemas';

	export type MembersListLabels = {
		name: string;
		email: string;
		plan: string;
		noPlan: string;
		status: string;
		expires: string;
		active: string;
		expired: string;
		actions: string;
		view: string;
		noMembers: string;
		noResults: string;
		searchPlaceholder: string;
		filterAll: string;
		filterActive: string;
		filterExpired: string;
		filterPlan: string;
		filterPlanAll: string;
		showing: string;
		reload: string;
		newBadge: string;
		previous: string;
		next: string;
		invitePending: string;
		inviteAccepted: string;
		inviteCancelled: string;
	};

	type PlanFilterOption = { id: string; name: string };
	type StatusFilter = 'all' | 'active' | 'expired';

	type Props = {
		locale: Locale;
		members: Member[];
		plans: PlanFilterOption[];
		labels: MembersListLabels;
		meta: PageMeta;
		filters: {
			q: string;
			status: StatusFilter;
			planId: string;
		};
		highlightId?: string | null;
	};

	let {
		locale,
		members,
		plans,
		labels,
		meta,
		filters,
		highlightId = null
	}: Props = $props();

	let query = $state('');
	let pending = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		query = filters.q;
	});

	$effect(() => {
		if (!highlightId) return;
		const scrollTimer = window.setTimeout(() => {
			const el =
				document.getElementById(`member-row-${highlightId}`) ??
				document.getElementById(`member-row-desk-${highlightId}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 80);
		return () => window.clearTimeout(scrollTimer);
	});

	const emptyMessage = $derived(
		meta.total === 0 && !filters.q && filters.status === 'all' && filters.planId === 'all'
			? labels.noMembers
			: labels.noResults
	);

	const pathname = $derived(`/${locale}/members`);

	function currentParams() {
		return {
			q: filters.q || undefined,
			status: filters.status !== 'all' ? filters.status : undefined,
			plan: filters.planId !== 'all' ? filters.planId : undefined
		};
	}

	function hrefFor(overrides: Record<string, string | null | undefined>, pageNum?: number) {
		const base = currentParams();
		const merged: Record<string, string | undefined> = { ...base };
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

	async function pushParams(
		overrides: Record<string, string | null | undefined>,
		opts?: { debounce?: boolean }
	) {
		const run = async () => {
			const target = hrefFor(overrides, 1);
			const current = `${page.url.pathname}${page.url.search}`;
			if (target === current) return;
			pending = true;
			try {
				await goto(target, { keepFocus: true, noScroll: true });
			} finally {
				pending = false;
			}
		};

		if (opts?.debounce) {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				debounceTimer = null;
				void run();
			}, 300);
			return;
		}
		await run();
	}

	async function reload() {
		pending = true;
		try {
			await invalidate(OPS_LOAD_DEPS.members);
		} finally {
			pending = false;
		}
	}

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
		return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
	}

	function formatExpires(iso: string) {
		try {
			return new Date(iso).toLocaleDateString(locale, {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			});
		} catch {
			return iso;
		}
	}

	function inviteBadgeClass(status: Member['invite_status']) {
		if (status === 'pending') {
			return 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]';
		}
		if (status === 'cancelled') {
			return 'bg-[var(--color-muted)]/20 text-[var(--color-muted)]';
		}
		return 'bg-[var(--color-success)]/15 text-[var(--color-success)]';
	}

	function inviteBadgeLabel(status: Member['invite_status']) {
		if (status === 'pending') return labels.invitePending;
		if (status === 'cancelled') return labels.inviteCancelled;
		return labels.inviteAccepted;
	}

	function showingLabel() {
		return labels.showing
			.replace('{from}', String(meta.from))
			.replace('{to}', String(meta.to))
			.replace('{total}', String(meta.total));
	}

	function goToMember(id: string) {
		void goto(`/${locale}/members/${id}`);
	}

	const statusChips = $derived([
		['all', labels.filterAll],
		['active', labels.filterActive],
		['expired', labels.filterExpired]
	] as const);
</script>

<div class="flex flex-col gap-4">
	<div
		class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5"
	>
		<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<div class="relative min-w-0 flex-1">
					<label class="sr-only" for="members-search">{labels.searchPlaceholder}</label>
					<Search
						class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
						aria-hidden="true"
					/>
					<Input
						id="members-search"
						name="q"
						type="search"
						class="!pl-10"
						maxlength={LIMITS.search}
						placeholder={labels.searchPlaceholder}
						bind:value={query}
						oninput={(e) => {
							const value = sanitizeSearchInput((e.currentTarget as HTMLInputElement).value);
							query = value;
							void pushParams({ q: value.trim() || null }, { debounce: true });
						}}
					/>
				</div>
				<button
					type="button"
					onclick={() => void reload()}
					disabled={pending}
					class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
					aria-label={labels.reload}
					title={labels.reload}
				>
					<RefreshCw class="h-4 w-4 {pending ? 'animate-spin' : ''}" aria-hidden="true" />
				</button>
			</div>

			<div class="hidden flex-wrap items-center gap-2 sm:flex">
				{#each statusChips as [key, label] (key)}
					{@const selected = filters.status === key}
					<button
						type="button"
						onclick={() => void pushParams({ status: key === 'all' ? null : key })}
						class="inline-flex h-11 min-h-[var(--touch-target)] shrink-0 items-center justify-center rounded-lg px-3 text-sm font-semibold leading-none transition-colors {selected
							? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
							: 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'}"
					>
						{label}
					</button>
				{/each}

				{#if plans.length > 0}
					<div class="w-full sm:w-auto sm:min-w-[12rem]">
						<label class="sr-only" for="members-plan-filter">{labels.filterPlan}</label>
						<Select
							id="members-plan-filter"
							value={filters.planId}
							class="!h-11 !min-h-[var(--touch-target)] !bg-[var(--color-surface)] !px-3 !py-0 !text-sm !leading-none"
							onchange={(e) => {
								const value = (e.currentTarget as HTMLSelectElement).value;
								void pushParams({ plan: value === 'all' ? null : value });
							}}
						>
							<option value="all">{labels.filterPlanAll}</option>
							{#each plans as plan (plan.id)}
								<option value={plan.id}>{plan.name}</option>
							{/each}
						</Select>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div
		class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
	>
		{#if members.length === 0}
			<p class="px-5 py-12 text-center text-sm text-[var(--color-muted)]">{emptyMessage}</p>
		{:else}
			<!-- Mobile cards: name → email → badges (same rhythm as trainers) -->
			<ul class="flex flex-col divide-y divide-[var(--color-border)]/70 sm:hidden">
				{#each members as m (m.id)}
					{@const active = m.status === 'active'}
					{@const isNew = highlightId === m.id}
					<li id="member-row-{m.id}" class={isNew ? 'amrap-row-shine' : ''}>
						<button
							type="button"
							onclick={() => goToMember(m.id)}
							class="flex w-full items-start gap-3 px-4 py-3.5 text-left outline-none ring-[var(--color-ring)] transition-colors hover:bg-[var(--color-surface-hover)]/40 focus-visible:ring-2"
						>
							<span
								class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]"
							>
								{initials(m.name)}
							</span>
							<span class="min-w-0 flex-1">
								<span class="flex items-center gap-2">
									<span class="truncate font-semibold text-[var(--color-text)]">{m.name}</span>
									{#if isNew}
										<span class="shrink-0 text-[11px] font-medium text-[var(--color-primary)]">
											{labels.newBadge}
										</span>
									{/if}
								</span>
								<span class="mt-0.5 block truncate text-xs text-[var(--color-muted)]">
									{m.email ?? m.phone ?? '—'}
								</span>
								<span class="mt-1.5 flex flex-wrap items-center gap-1.5">
									{#if m.invite_status === 'pending' || m.invite_status === 'cancelled'}
										<span
											class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {inviteBadgeClass(
												m.invite_status
											)}"
										>
											{inviteBadgeLabel(m.invite_status)}
										</span>
									{/if}
									<span
										class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {active
											? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
											: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'}"
									>
										{active ? labels.active : labels.expired}
									</span>
									<span
										class="inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-xs font-semibold {m.plan_name
											? 'bg-[var(--color-primary-soft)] text-[var(--color-text)]'
											: 'bg-[var(--color-surface-hover)] text-[var(--color-muted)]'}"
									>
										{m.plan_name ?? labels.noPlan}
									</span>
								</span>
							</span>
							<span
								class="inline-flex h-11 shrink-0 items-center text-[var(--color-primary)]"
								aria-hidden="true"
							>
								<ArrowRight class="h-4 w-4" />
							</span>
						</button>
					</li>
				{/each}
			</ul>

			<!-- Desktop table -->
			<div class="hidden overflow-x-auto sm:block">
				<table class="w-full border-collapse text-left text-sm">
					<thead>
						<tr
							class="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]"
						>
							<th class="px-4 py-3 sm:px-5">{labels.name}</th>
							<th class="px-4 py-3">{labels.plan}</th>
							<th class="px-4 py-3">{labels.status}</th>
							<th class="px-4 py-3">{labels.expires}</th>
							<th class="px-4 py-3 pr-5 text-right">{labels.actions}</th>
						</tr>
					</thead>
					<tbody>
						{#each members as m (m.id)}
							{@const active = m.status === 'active'}
							{@const isNew = highlightId === m.id}
							<tr
								id="member-row-desk-{m.id}"
								role="link"
								tabindex="0"
								onclick={() => goToMember(m.id)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										goToMember(m.id);
									}
								}}
								class="cursor-pointer border-b border-[var(--color-border)]/70 transition-colors last:border-b-0 hover:bg-[var(--color-surface-hover)]/40 {isNew
									? 'amrap-row-shine'
									: ''}"
							>
								<td class="px-4 py-3.5 sm:px-5">
									<div class="flex items-center gap-3">
										<span
											class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]"
										>
											{initials(m.name)}
										</span>
										<div class="min-w-0">
											<p class="truncate font-semibold text-[var(--color-text)]">
												{m.name}
												{#if isNew}
													<span class="ml-2 text-[11px] font-medium text-[var(--color-primary)]">
														{labels.newBadge}
													</span>
												{/if}
											</p>
											<div class="mt-0.5 flex flex-wrap items-center gap-1.5">
												{#if m.invite_status === 'pending' || m.invite_status === 'cancelled'}
													<span
														class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {inviteBadgeClass(
															m.invite_status
														)}"
													>
														{inviteBadgeLabel(m.invite_status)}
													</span>
												{/if}
												<p class="truncate text-xs text-[var(--color-muted)]">
													{m.email ?? m.phone ?? '—'}
												</p>
											</div>
										</div>
									</div>
								</td>
								<td class="px-4 py-3.5">
									<span
										class="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold {m.plan_name
											? 'bg-[var(--color-primary-soft)] text-[var(--color-text)]'
											: 'bg-[var(--color-surface-hover)] text-[var(--color-muted)]'}"
									>
										{m.plan_name ?? labels.noPlan}
									</span>
								</td>
								<td class="px-4 py-3.5">
									<span
										class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {active
											? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
											: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'}"
									>
										{active ? labels.active : labels.expired}
									</span>
								</td>
								<td
									class="px-4 py-3.5 tabular-nums {active
										? 'text-[var(--color-text)]'
										: 'text-[var(--color-danger)]'}"
								>
									{formatExpires(m.membership_expires_at)}
								</td>
								<td class="px-4 py-3.5 pr-5 text-right">
									<span
										class="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
									>
										{labels.view}
										<ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if meta.total > 0}
			<div
				class="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
			>
				<p class="text-sm text-[var(--color-muted)]">{showingLabel()}</p>
				{#if meta.totalPages > 1}
					<div class="flex items-center gap-2">
						{#if meta.page <= 1}
							<span
								class="inline-flex h-11 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-muted)] opacity-50"
							>
								<ChevronLeft class="h-4 w-4" aria-hidden="true" />
								{labels.previous}
							</span>
						{:else}
							<a
								href={hrefFor({}, meta.page - 1)}
								class="inline-flex h-11 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
							>
								<ChevronLeft class="h-4 w-4" aria-hidden="true" />
								{labels.previous}
							</a>
						{/if}
						{#if meta.page >= meta.totalPages}
							<span
								class="inline-flex h-11 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-muted)] opacity-50"
							>
								{labels.next}
								<ChevronRight class="h-4 w-4" aria-hidden="true" />
							</span>
						{:else}
							<a
								href={hrefFor({}, meta.page + 1)}
								class="inline-flex h-11 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
							>
								{labels.next}
								<ChevronRight class="h-4 w-4" aria-hidden="true" />
							</a>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
