<script lang="ts">
	import type { Locale } from '$lib/i18n/config';
	import type { CheckInListItem } from '$lib/checkin/queries';

	export type CheckInListLabels = {
		colMember: string;
		colTime: string;
		colPlan: string;
		colSource: string;
		noPlan: string;
		sourceQr: string;
		sourceManual: string;
		sourceKiosk: string;
		empty: string;
		viewMemberProfile?: string;
	};

	type Props = {
		locale: Locale;
		items: CheckInListItem[];
		labels: CheckInListLabels;
		detailBaseHref: string;
		showMemberProfileLink?: boolean;
	};

	let {
		locale,
		items,
		labels,
		detailBaseHref,
		showMemberProfileLink = false
	}: Props = $props();

	function sourceLabel(source: string) {
		const s = source.toUpperCase();
		if (s === 'QR') return labels.sourceQr;
		if (s === 'MANUAL') return labels.sourceManual;
		if (s === 'KIOSK') return labels.sourceKiosk;
		return source;
	}

	function formatTime(iso: string) {
		try {
			return new Date(iso).toLocaleString(locale, {
				day: '2-digit',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
		return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
	}
</script>

{#if items.length === 0}
	<p class="px-5 py-10 text-center text-sm text-[var(--color-muted)]">
		{labels.empty}
	</p>
{:else}
	<!-- Mobile cards -->
	<ul class="flex flex-col divide-y divide-[var(--color-border)]/70 sm:hidden">
		{#each items as row (row.id)}
			{@const calendarHref = `${detailBaseHref}/${row.membershipId}`}
			{@const memberHref = `/${locale}/members/${row.membershipId}`}
			<li class="px-4 py-3">
				<a
					href={calendarHref}
					class="flex items-start gap-3 rounded-lg outline-none ring-[var(--color-ring)] focus-visible:ring-2"
				>
					<span
						class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[10px] font-bold text-[var(--color-primary)]"
					>
						{initials(row.memberName)}
					</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate font-semibold text-[var(--color-text)]"
							>{row.memberName}</span
						>
						<span class="mt-0.5 block text-xs tabular-nums text-[var(--color-muted)]">
							{formatTime(row.checkedInAt)}
						</span>
						<span class="mt-1 inline-flex gap-2 text-xs text-[var(--color-muted)]">
							<span
								class="rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 font-semibold text-[var(--color-text)]"
							>
								{row.planName ?? labels.noPlan}
							</span>
							<span>{sourceLabel(row.source)}</span>
						</span>
					</span>
				</a>
				{#if showMemberProfileLink && labels.viewMemberProfile}
					<a
						href={memberHref}
						class="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
					>
						{labels.viewMemberProfile}
					</a>
				{/if}
			</li>
		{/each}
	</ul>

	<!-- Desktop table -->
	<div class="hidden overflow-x-auto sm:block">
		<table class="w-full min-w-[36rem] border-collapse text-left text-sm">
			<thead>
				<tr
					class="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]"
				>
					<th class="px-4 py-3 sm:px-5">{labels.colMember}</th>
					<th class="px-4 py-3">{labels.colTime}</th>
					<th class="px-4 py-3">{labels.colPlan}</th>
					<th class="px-4 py-3">{labels.colSource}</th>
					{#if showMemberProfileLink && labels.viewMemberProfile}
						<th class="px-4 py-3 pr-5 text-right">{labels.viewMemberProfile}</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each items as row (row.id)}
					{@const calendarHref = `${detailBaseHref}/${row.membershipId}`}
					{@const memberHref = `/${locale}/members/${row.membershipId}`}
					<tr class="border-b border-[var(--color-border)]/70 last:border-b-0">
						<td class="px-4 py-3 sm:px-5">
							<a
								href={calendarHref}
								class="flex items-center gap-3 rounded-lg outline-none ring-[var(--color-ring)] transition-colors hover:opacity-90 focus-visible:ring-2"
							>
								<span
									class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[10px] font-bold text-[var(--color-primary)]"
								>
									{initials(row.memberName)}
								</span>
								<span class="truncate font-semibold text-[var(--color-text)]"
									>{row.memberName}</span
								>
							</a>
						</td>
						<td class="px-4 py-3 tabular-nums text-[var(--color-text)]">
							<a href={calendarHref} class="hover:underline">{formatTime(row.checkedInAt)}</a>
						</td>
						<td class="px-4 py-3">
							<span
								class="inline-flex rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text)]"
							>
								{row.planName ?? labels.noPlan}
							</span>
						</td>
						<td class="px-4 py-3 text-[var(--color-muted)]">
							{sourceLabel(row.source)}
						</td>
						{#if showMemberProfileLink && labels.viewMemberProfile}
							<td class="px-4 py-3 pr-5 text-right">
								<a
									href={memberHref}
									class="text-sm font-semibold text-[var(--color-primary)] hover:underline"
								>
									{labels.viewMemberProfile}
								</a>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
