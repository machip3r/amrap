<script lang="ts">
	import { page } from '$app/state';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Button from '$lib/components/ui/Button.svelte';
	import { defaultLocale, isLocale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';

	const locale = $derived.by(() => {
		const seg = page.url.pathname.split('/')[1];
		return seg && isLocale(seg) ? seg : defaultLocale;
	});
	const d = $derived(getDictionary(locale));

	const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
		immediate: true,
		onRegisteredSW(_swUrl, registration) {
			if (!registration) return;
			// Check for a new shell periodically (ops floor stays on one tab for hours).
			const hour = 60 * 60 * 1000;
			window.setInterval(() => {
				void registration.update();
			}, hour);
		}
	});

	let updating = $state(false);

	const showToast = $derived($needRefresh);
	const title = $derived(d.pwa.updateTitle);
	const description = $derived(d.pwa.updateAvailable);

	function dismiss() {
		if (updating) return;
		offlineReady.set(false);
		needRefresh.set(false);
	}

	async function applyUpdate() {
		if (updating) return;
		updating = true;
		try {
			await updateServiceWorker(true);
		} catch {
			updating = false;
		}
	}
</script>

{#if showToast}
	<div
		class="fixed bottom-[calc(var(--safe-bottom,0px)+1rem)] left-3 right-3 z-[60] mx-auto max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl sm:left-auto sm:right-4 sm:bottom-[calc(var(--ops-bottom-clearance,1rem)+5.5rem)] sm:w-full sm:p-5"
		role="dialog"
		aria-modal="false"
		aria-labelledby="pwa-reload-title"
		aria-describedby="pwa-reload-desc"
	>
		<div class="flex flex-col gap-4">
			<div class="min-w-0">
				<p
					id="pwa-reload-title"
					class="font-title text-base font-bold tracking-tight text-[var(--color-text)]"
				>
					{title}
				</p>
				<p id="pwa-reload-desc" class="mt-1.5 text-sm leading-snug text-[var(--color-muted)]">
					{description}
				</p>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row-reverse">
				<Button
					type="button"
					variant="primary"
					class="min-h-11 w-full flex-1 gap-2 shadow-sm sm:w-auto"
					disabled={updating}
					onclick={applyUpdate}
				>
					{#if updating}
						<Loader2 class="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
					{/if}
					{updating ? d.pwa.reloading : d.pwa.reload}
				</Button>
				<Button
					type="button"
					variant="ghost"
					class="min-h-11 w-full flex-1 border border-[var(--color-border)] px-3 text-sm font-semibold sm:w-auto"
					disabled={updating}
					onclick={dismiss}
				>
					{d.pwa.dismiss}
				</Button>
			</div>
		</div>
	</div>
{/if}
