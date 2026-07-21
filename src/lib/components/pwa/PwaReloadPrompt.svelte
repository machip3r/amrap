<script lang="ts">
	import { page } from '$app/state';
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

	const showToast = $derived($offlineReady || $needRefresh);

	function dismiss() {
		offlineReady.set(false);
		needRefresh.set(false);
	}
</script>

{#if showToast}
	<div
		class="fixed inset-x-3 bottom-[calc(var(--safe-bottom,0px)+1rem)] z-[60] mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-[calc(var(--ops-bottom-clearance,1rem)+5.5rem)]"
		role="status"
		aria-live="polite"
	>
		<p class="text-sm font-medium text-[var(--color-text)]">
			{#if $needRefresh}
				{d.pwa.updateAvailable}
			{:else}
				{d.pwa.offlineReady}
			{/if}
		</p>
		<div class="flex flex-wrap gap-2">
			{#if $needRefresh}
				<Button
					type="button"
					variant="primary"
					class="min-h-11 flex-1 shadow-sm"
					onclick={() => updateServiceWorker(true)}
				>
					{d.pwa.reload}
				</Button>
			{/if}
			<Button type="button" variant="ghost" class="min-h-11 flex-1" onclick={dismiss}>
				{d.pwa.dismiss}
			</Button>
		</div>
	</div>
{/if}
