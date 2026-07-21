<script lang="ts">
	import { page } from "$app/state";
	import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
	import Loader2 from "@lucide/svelte/icons/loader-2";
	import RefreshCw from "@lucide/svelte/icons/refresh-cw";
	import Button from "$lib/components/ui/Button.svelte";
	import { defaultLocale, isLocale } from "$lib/i18n/config";
	import { getDictionary } from "$lib/i18n/dictionaries";
	import { useRegisterSW } from "virtual:pwa-register/svelte";

	const locale = $derived.by(() => {
		const seg = page.url.pathname.split("/")[1];
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
		},
	});

	let updating = $state(false);

	const showToast = $derived($offlineReady || $needRefresh);
	const isUpdate = $derived($needRefresh);
	const title = $derived(
		isUpdate ? d.pwa.updateTitle : d.pwa.offlineReadyTitle,
	);
	const description = $derived(
		isUpdate ? d.pwa.updateAvailable : d.pwa.offlineReady,
	);

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
		class="fixed inset-x-3 bottom-[calc(var(--safe-bottom,0px)+1rem)] z-[60] mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl sm:inset-x-auto sm:right-4 sm:bottom-[calc(var(--ops-bottom-clearance,1rem)+5.5rem)]"
		role="dialog"
		aria-modal="false"
		aria-labelledby="pwa-reload-title"
		aria-describedby="pwa-reload-desc"
	>
		<div
			class="h-1 w-full bg-[var(--color-primary)]"
			aria-hidden="true"
		></div>
		<div class="flex flex-col gap-4 p-4 sm:p-5">
			<div class="flex items-start gap-3">
				<span
					class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl {isUpdate
						? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
						: 'bg-[var(--color-success)]/15 text-[var(--color-success)]'}"
				>
					{#if isUpdate}
						<RefreshCw class="h-5 w-5" aria-hidden="true" />
					{:else}
						<CheckCircle2 class="h-5 w-5" aria-hidden="true" />
					{/if}
				</span>
				<div class="min-w-0 flex-1 pt-0.5">
					<p
						id="pwa-reload-title"
						class="font-title text-base font-bold tracking-tight text-[var(--color-text)]"
					>
						{title}
					</p>
					<p
						id="pwa-reload-desc"
						class="mt-1.5 text-sm leading-snug text-[var(--color-muted)]"
					>
						{description}
					</p>
				</div>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row-reverse">
				{#if isUpdate}
					<Button
						type="button"
						variant="primary"
						class="min-h-11 w-full flex-1 gap-2 shadow-sm sm:w-auto"
						disabled={updating}
						onclick={applyUpdate}
					>
						{#if updating}
							<Loader2
								class="h-4 w-4 shrink-0 animate-spin"
								aria-hidden="true"
							/>
						{/if}
						{updating ? d.pwa.reloading : d.pwa.reload}
					</Button>
				{/if}
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
