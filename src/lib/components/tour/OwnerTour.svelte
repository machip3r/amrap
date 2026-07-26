<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import { getSafeAreaInsets } from '$lib/dom/safe-area';
	import { OWNER_TOUR_STORAGE_KEY, START_OWNER_TOUR_COOKIE } from '$lib/tour/constants';
	import { OWNER_TOUR_STEPS, ownerTourHref } from '$lib/tour/owner-tour';
	import { onMount } from 'svelte';

	type Props = {
		locale: Locale;
		d: Dictionary;
		enabled: boolean;
		/** Force-start from Settings replay. */
		forceStart?: boolean;
	};

	let { locale, d, enabled, forceStart = false }: Props = $props();

	let active = $state(false);
	let index = $state(0);
	let rect = $state<DOMRect | null>(null);
	let tipStyle = $state('');
	let tipEl = $state<HTMLDivElement | undefined>();
	let highlightStyle = $state('');

	const step = $derived(OWNER_TOUR_STEPS[index] ?? null);
	const labels = $derived(d.tour);

	function readCookie(name: string) {
		if (!browser) return null;
		const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
		return match ? decodeURIComponent(match[1]!) : null;
	}

	function clearStartCookie() {
		document.cookie = `${START_OWNER_TOUR_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
	}

	function isDismissed() {
		try {
			return localStorage.getItem(OWNER_TOUR_STORAGE_KEY) === '1';
		} catch {
			return false;
		}
	}

	function dismiss() {
		active = false;
		rect = null;
		try {
			localStorage.setItem(OWNER_TOUR_STORAGE_KEY, '1');
		} catch {
			/* ignore */
		}
		clearStartCookie();
		const url = new URL(page.url);
		if (url.searchParams.has('tour')) {
			url.searchParams.delete('tour');
			void goto(`${url.pathname}${url.search}`, { replaceState: true, noScroll: true });
		}
	}

	function startTour() {
		index = 0;
		active = true;
		clearStartCookie();
		void ensureStepTarget();
	}

	function placeTip(r: DOMRect) {
		const vv = window.visualViewport;
		const viewW = vv?.width ?? window.innerWidth;
		const viewH = vv?.height ?? window.innerHeight;
		const viewTop = vv?.offsetTop ?? 0;
		const viewLeft = vv?.offsetLeft ?? 0;
		const insets = getSafeAreaInsets();
		const margin = 12;
		const minTop = insets.top + margin;
		const isMobile = window.matchMedia('(max-width: 767px)').matches;
		/** Keep tip clear of fixed bottom tabs + home indicator. */
		const bottomChrome = isMobile ? 72 + insets.bottom : insets.bottom;
		const usableBottom = viewH - bottomChrome - margin;

		const tipW = Math.min(20 * 16, viewW - margin * 2);
		const tipH = tipEl?.offsetHeight || 210;
		const gap = 12;

		const spaceBelow = usableBottom - (r.bottom + gap);
		const placeAbove = r.top > viewH * 0.4 || spaceBelow < tipH;

		let top = placeAbove ? r.top - tipH - gap : r.bottom + gap;
		top = Math.max(minTop, Math.min(top, usableBottom - tipH));

		let left = Math.min(Math.max(r.left, margin), viewW - tipW - margin);
		left = Math.max(margin + insets.left, left);

		tipStyle = `top:${Math.round(top + viewTop)}px;left:${Math.round(left + viewLeft)}px;`;
		highlightStyle = `top:${Math.round(r.top + viewTop - 6)}px;left:${Math.round(r.left + viewLeft - 6)}px;width:${Math.round(r.width + 12)}px;height:${Math.round(r.height + 12)}px;`;
	}

	async function ensureStepTarget() {
		const current = OWNER_TOUR_STEPS[index];
		if (!current) {
			dismiss();
			return;
		}
		const targetHref = ownerTourHref(locale, current.path);
		if (!page.url.pathname.startsWith(targetHref)) {
			await goto(`${targetHref}?tour=1`, { noScroll: true });
			await new Promise((r) => setTimeout(r, 120));
		}
		await measure();
	}

	async function measure() {
		const current = OWNER_TOUR_STEPS[index];
		if (!current) return;
		for (let i = 0; i < 12; i++) {
			const el = document.querySelector(current.selector) as HTMLElement | null;
			if (el) {
				el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
				await new Promise((r) => requestAnimationFrame(() => r(undefined)));
				const r = el.getBoundingClientRect();
				rect = r;
				placeTip(r);
				// Second pass once tip height is known (after bind).
				queueMicrotask(() => {
					if (rect) placeTip(rect);
				});
				requestAnimationFrame(() => {
					if (rect) placeTip(rect);
				});
				return;
			}
			await new Promise((r) => setTimeout(r, 80));
		}
		// Missing target — skip to next.
		if (index < OWNER_TOUR_STEPS.length - 1) {
			index += 1;
			await ensureStepTarget();
		} else {
			dismiss();
		}
	}

	async function next() {
		if (index >= OWNER_TOUR_STEPS.length - 1) {
			dismiss();
			return;
		}
		index += 1;
		await ensureStepTarget();
	}

	async function back() {
		if (index <= 0) return;
		index -= 1;
		await ensureStepTarget();
	}

	onMount(() => {
		if (!enabled) return;
		const wantsStart =
			forceStart ||
			page.url.searchParams.get('tour') === '1' ||
			readCookie(START_OWNER_TOUR_COOKIE) === '1';
		if (wantsStart && (forceStart || !isDismissed())) {
			startTour();
		}
		const onResize = () => {
			if (active) void measure();
		};
		window.addEventListener('resize', onResize);
		window.addEventListener('scroll', onResize, true);
		window.visualViewport?.addEventListener('resize', onResize);
		window.visualViewport?.addEventListener('scroll', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onResize, true);
			window.visualViewport?.removeEventListener('resize', onResize);
			window.visualViewport?.removeEventListener('scroll', onResize);
		};
	});

	$effect(() => {
		if (!active || !enabled) return;
		void measure();
	});
</script>

{#if active && step && rect}
	<div class="pointer-events-none fixed inset-0 z-[80]" aria-hidden="true">
		<div class="absolute inset-0 bg-black/50"></div>
		<div
			class="absolute rounded-xl ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-transparent"
			style="{highlightStyle}box-shadow:0 0 0 9999px rgba(0,0,0,0.5);"
		></div>
	</div>

	<div
		bind:this={tipEl}
		class="fixed z-[90] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl"
		style={tipStyle}
		role="dialog"
		aria-modal="true"
		aria-labelledby="owner-tour-title"
	>
		<p id="owner-tour-title" class="font-title text-base font-bold text-[var(--color-text)]">
			{labels[step.titleKey]}
		</p>
		<p class="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">{labels[step.bodyKey]}</p>
		<p class="mt-2 text-xs font-medium text-[var(--color-muted)]">
			{index + 1} / {OWNER_TOUR_STEPS.length}
		</p>
		<div class="mt-4 flex flex-wrap items-center gap-2">
			<Button type="button" variant="ghost" class="!h-10 !min-h-10 px-3 text-sm" onclick={dismiss}>
				{labels.skip}
			</Button>
			<div class="ml-auto flex gap-2">
				{#if index > 0}
					<Button type="button" variant="ghost" class="!h-10 !min-h-10 px-3 text-sm" onclick={back}>
						{labels.back}
					</Button>
				{/if}
				<Button type="button" class="!h-10 !min-h-10 px-3 text-sm" onclick={next}>
					{index >= OWNER_TOUR_STEPS.length - 1 ? labels.done : labels.next}
				</Button>
			</div>
		</div>
	</div>
{/if}
