<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Download from '@lucide/svelte/icons/download';
	import Button from '$lib/components/ui/Button.svelte';
	import { defaultLocale, isLocale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';

	const DISMISS_KEY = 'amrap-pwa-install-dismissed';

	type BeforeInstallPromptEvent = Event & {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	};

	const locale = $derived.by(() => {
		const seg = page.url.pathname.split('/')[1];
		return seg && isLocale(seg) ? seg : defaultLocale;
	});
	const d = $derived(getDictionary(locale));

	let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	let iosHint = $state(false);
	let dismissed = $state(false);
	let installing = $state(false);

	const show = $derived(!dismissed && (deferredPrompt !== null || iosHint));

	$effect(() => {
		if (!browser) return;

		try {
			if (localStorage.getItem(DISMISS_KEY) === '1') {
				dismissed = true;
			}
		} catch {
			/* ignore */
		}

		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			('standalone' in navigator &&
				(navigator as Navigator & { standalone?: boolean }).standalone === true);

		if (isStandalone) {
			dismissed = true;
			return;
		}

		const ua = navigator.userAgent;
		const isIos = /iphone|ipad|ipod/i.test(ua);
		const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
		if (isIos && isSafari) {
			iosHint = true;
		}

		function onBeforeInstall(e: Event) {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
			iosHint = false;
		}

		window.addEventListener('beforeinstallprompt', onBeforeInstall);
		return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
	});

	async function install() {
		if (!deferredPrompt) return;
		installing = true;
		try {
			await deferredPrompt.prompt();
			await deferredPrompt.userChoice;
			deferredPrompt = null;
			dismiss();
		} finally {
			installing = false;
		}
	}

	function dismiss() {
		dismissed = true;
		deferredPrompt = null;
		iosHint = false;
		try {
			localStorage.setItem(DISMISS_KEY, '1');
		} catch {
			/* ignore */
		}
	}
</script>

{#if show}
	<div
		class="fixed bottom-[calc(var(--safe-bottom,0px)+1rem)] left-3 right-3 z-[55] mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg sm:left-auto sm:right-4 sm:bottom-[calc(var(--ops-bottom-clearance,1rem)+0.75rem)] sm:w-full"
		role="dialog"
		aria-label={d.pwa.installTitle}
	>
		<div class="flex items-start gap-3">
			<span
				class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
			>
				<Download class="h-5 w-5" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-semibold text-[var(--color-text)]">{d.pwa.installTitle}</p>
				<p class="mt-1 text-sm text-[var(--color-muted)]">
					{iosHint ? d.pwa.installIosHint : d.pwa.installDescription}
				</p>
			</div>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if deferredPrompt}
				<Button
					type="button"
					variant="primary"
					class="min-h-11 flex-1 shadow-sm"
					disabled={installing}
					onclick={install}
				>
					{d.pwa.install}
				</Button>
			{/if}
			<Button type="button" variant="ghost" class="min-h-11 flex-1" onclick={dismiss}>
				{d.pwa.dismiss}
			</Button>
		</div>
	</div>
{/if}
