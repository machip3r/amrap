<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { PageMeta } from '$lib/pagination';

	type Props = {
		meta: PageMeta;
		href: string;
		searchParams?: Record<string, string | undefined>;
		labels: {
			showing: string;
			previous: string;
			next: string;
		};
	};

	let { meta, href, searchParams, labels }: Props = $props();

	function showingLabel(from: number, to: number, total: number) {
		return labels.showing
			.replace('{from}', String(from))
			.replace('{to}', String(to))
			.replace('{total}', String(total));
	}

	function hrefForPage(page: number) {
		const params = new URLSearchParams();
		if (searchParams) {
			for (const [key, value] of Object.entries(searchParams)) {
				if (key === 'page') continue;
				if (value != null && value !== '') params.set(key, value);
			}
		}
		if (page > 1) params.set('page', String(page));
		const qs = params.toString();
		return qs ? `${href}?${qs}` : href;
	}

	const prevDisabled = $derived(meta.page <= 1);
	const nextDisabled = $derived(meta.page >= meta.totalPages);
	const prevHref = $derived(hrefForPage(meta.page - 1));
	const nextHref = $derived(hrefForPage(meta.page + 1));
</script>

{#if meta.total > 0}
	<div
		class="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
	>
		<p class="text-sm text-[var(--color-muted)]">
			{showingLabel(meta.from, meta.to, meta.total)}
		</p>
		{#if meta.totalPages > 1}
			<div class="flex items-center gap-2">
				{#if prevDisabled}
					<span
						class="inline-flex h-11 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-muted)] opacity-50"
					>
						<ChevronLeft class="h-4 w-4" aria-hidden="true" />
						{labels.previous}
					</span>
				{:else}
					<a
						href={prevHref}
						data-sveltekit-preload-data="off"
						class="inline-flex h-11 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
					>
						<ChevronLeft class="h-4 w-4" aria-hidden="true" />
						{labels.previous}
					</a>
				{/if}
				{#if nextDisabled}
					<span
						class="inline-flex h-11 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-muted)] opacity-50"
					>
						{labels.next}
						<ChevronRight class="h-4 w-4" aria-hidden="true" />
					</span>
				{:else}
					<a
						href={nextHref}
						data-sveltekit-preload-data="off"
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
