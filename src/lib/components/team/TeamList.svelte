<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Search from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { PageMeta } from '$lib/pagination';
	import type { TeamMember } from '$lib/team/queries';
	import { LIMITS, sanitizeSearchInput } from '$lib/validation/schemas';

	export type TeamListLabels = {
		name: string;
		email: string;
		joined: string;
		actions: string;
		remove: string;
		confirmRemove: string;
		noRows: string;
		noResults: string;
		searchPlaceholder: string;
		showing: string;
		reload: string;
		newBadge: string;
		view: string;
		previous: string;
		next: string;
		invitePending: string;
		inviteAccepted: string;
		inviteCancelled: string;
		cancel: string;
	};

	type ListRole = 'trainer' | 'staff';

	type Props = {
		locale: Locale;
		listRole: ListRole;
		members: TeamMember[];
		labels: TeamListLabels;
		meta: PageMeta;
		q: string;
		highlightId?: string | null;
		currentUserId: string;
	};

	let {
		locale,
		listRole,
		members,
		labels,
		meta,
		q: initialQ,
		highlightId = null,
		currentUserId
	}: Props = $props();

	let query = $state('');
	let pending = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let removing = $state<TeamMember | null>(null);

	$effect(() => {
		query = initialQ;
	});

	$effect(() => {
		if (!highlightId) return;
		const scrollTimer = window.setTimeout(() => {
			document
				.getElementById(`team-row-${highlightId}`)
				?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 80);
		return () => window.clearTimeout(scrollTimer);
	});

	const emptyMessage = $derived(
		meta.total === 0 && !initialQ ? labels.noRows : labels.noResults
	);

	const pathname = $derived(
		`/${locale}/${listRole === 'trainer' ? 'trainers' : 'staff'}`
	);

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
		const pageN = pageNum ?? meta.page;
		if (pageN > 1) params.set('page', String(pageN));
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
			await invalidateAll();
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

	function formatJoined(iso: string) {
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

	function inviteBadgeClass(status: TeamMember['inviteStatus']) {
		if (status === 'pending') {
			return 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]';
		}
		if (status === 'cancelled') {
			return 'bg-[var(--color-muted)]/20 text-[var(--color-muted)]';
		}
		return 'bg-[var(--color-success)]/15 text-[var(--color-success)]';
	}

	function inviteBadgeLabel(status: TeamMember['inviteStatus']) {
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
		void goto(`${pathname}/${id}`);
	}
</script>

<div class="flex flex-col gap-4">
	<div
		class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5"
	>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative min-w-0 flex-1">
				<label class="sr-only" for="team-search">{labels.searchPlaceholder}</label>
				<Search
					class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
					aria-hidden="true"
				/>
				<Input
					id="team-search"
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
				class="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
				aria-label={labels.reload}
				title={labels.reload}
			>
				<RefreshCw class="h-4 w-4 {pending ? 'animate-spin' : ''}" aria-hidden="true" />
			</button>
		</div>
	</div>

	<div
		class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
	>
		<div class="overflow-x-auto">
			<table class="w-full min-w-[36rem] border-collapse text-left text-sm">
				<thead>
					<tr
						class="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]"
					>
						<th class="px-4 py-3 sm:px-5">{labels.name}</th>
						<th class="px-4 py-3">{labels.email}</th>
						<th class="px-4 py-3">{labels.joined}</th>
						<th class="px-4 py-3 pr-5 text-right">{labels.actions}</th>
					</tr>
				</thead>
				<tbody>
					{#if members.length === 0}
						<tr>
							<td colspan="4" class="px-5 py-12 text-center text-[var(--color-muted)]">
								{emptyMessage}
							</td>
						</tr>
					{:else}
						{#each members as m (m.id)}
							{@const isNew = highlightId === m.id}
							<tr
								id="team-row-{m.id}"
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
												<span
													class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {inviteBadgeClass(
														m.inviteStatus
													)}"
												>
													{inviteBadgeLabel(m.inviteStatus)}
												</span>
												{#if m.phone}
													<p class="truncate text-xs text-[var(--color-muted)]">{m.phone}</p>
												{/if}
											</div>
										</div>
									</div>
								</td>
								<td class="px-4 py-3.5 text-[var(--color-text)]">{m.email ?? '—'}</td>
								<td class="px-4 py-3.5 tabular-nums text-[var(--color-text)]">
									{formatJoined(m.createdAt)}
								</td>
								<td
									class="px-4 py-3.5 pr-5 text-right"
									onclick={(e) => e.stopPropagation()}
									onkeydown={(e) => e.stopPropagation()}
								>
									<div class="inline-flex items-center justify-end gap-3">
										<span
											class="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
										>
											{labels.view}
											<ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
										</span>
										{#if m.userId !== currentUserId}
											<button
												type="button"
												class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--color-danger)] transition-opacity hover:opacity-80"
												onclick={() => (removing = m)}
											>
												<Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
												{labels.remove}
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

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

	{#if removing}
		<ConfirmDialog
			open={removing != null}
			title={labels.remove}
			description="{labels.confirmRemove} ({removing.name})"
			cancelLabel={labels.cancel}
			confirmLabel={labels.remove}
			action="?/remove"
			onclose={() => (removing = null)}
		>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="team_member_id" value={removing.id} />
			<input type="hidden" name="list_role" value={listRole} />
		</ConfirmDialog>
	{/if}
</div>
