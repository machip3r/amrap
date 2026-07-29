<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Lock from '@lucide/svelte/icons/lock';
	import Button from '$lib/components/ui/Button.svelte';
	import type { GymPaymentAccountPublic } from '$lib/server/payments/gateway-accounts';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { Locale } from '$lib/i18n/config';

	type Props = {
		locale: Locale;
		d: Dictionary;
		canManage: boolean;
		canUseOnlineBilling: boolean;
		mpConfigured: boolean;
		account: GymPaymentAccountPublic | null;
		flash: string | null;
		form?: { error?: string; success?: string } | null;
	};

	let { locale, d, canManage, canUseOnlineBilling, mpConfigured, account, flash, form }: Props =
		$props();

	let syncPending = $state(false);
	let disconnectPending = $state(false);
	let connectPending = $state(false);
	let localFlash = $state<string | null>(null);
	let localError = $state<string | null>(null);

	const connected = $derived(account?.status === 'CONNECTED');

	const flashMap = $derived({
		connected: d.settings.gatewayFlashConnected,
		denied: d.settings.gatewayFlashDenied,
		error: d.settings.gatewayFlashError,
		forbidden: d.settings.gatewayFlashForbidden
	} as Record<string, string>);

	function openGatewayPopup() {
		localError = null;
		localFlash = null;
		const url = `/api/mercadopago/connect?locale=${locale}&popup=1`;
		const w = 560;
		const h = 720;
		const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
		const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
		const popup = window.open(
			url,
			'amrap-mp-oauth',
			`popup=yes,width=${w},height=${h},left=${left},top=${top},noopener=no`
		);
		if (!popup) {
			localError = d.settings.gatewayPopupBlocked;
			return;
		}
		connectPending = true;

		const onMessage = async (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			const data = event.data as { source?: string; result?: string } | null;
			if (!data || data.source !== 'amrap-mp-oauth' || !data.result) return;
			window.removeEventListener('message', onMessage);
			connectPending = false;
			try {
				popup.close();
			} catch {
				/* ignore */
			}
			const key = data.result;
			if (key === 'connected') {
				localFlash = flashMap.connected;
				await invalidateAll();
			} else {
				localError = flashMap[key] ?? d.settings.gatewayFlashError;
			}
		};
		window.addEventListener('message', onMessage);

		const poll = window.setInterval(() => {
			if (!popup.closed) return;
			window.clearInterval(poll);
			window.removeEventListener('message', onMessage);
			if (connectPending) {
				connectPending = false;
			}
		}, 500);
	}
</script>

{#if !canUseOnlineBilling}
	<div class="flex flex-col gap-5" data-tour="settings-online-billing">
		<div>
			<h2 class="font-title text-2xl font-bold text-[var(--color-text)]">
				{d.settings.gatewayTitle}
			</h2>
			<p class="mt-1 max-w-xl text-sm text-[var(--color-muted)]">
				{d.settings.gatewayHint}
			</p>
		</div>
		<section
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-6 text-center shadow-sm sm:p-8"
		>
			<div class="flex flex-col items-center gap-4">
				<div
					class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)]/15 text-[var(--color-muted)]"
				>
					<Lock class="h-5 w-5" aria-hidden="true" />
				</div>
				<div class="min-w-0 max-w-md">
					<h3 class="font-title text-lg font-bold text-[var(--color-text)]">
						{d.settings.gatewayLocked}
					</h3>
					<p class="mt-1 text-sm text-[var(--color-muted)]">
						{d.settings.gatewayLockedHint}
					</p>
				</div>
				<a
					href="/{locale}/organization#subscription"
					class="inline-flex min-h-[var(--touch-target)] items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] shadow-sm transition-opacity hover:opacity-90"
				>
					{d.settings.gatewayUpgrade}
				</a>
			</div>
		</section>
	</div>
{:else}
	<section
		class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		data-tour="settings-online-billing"
	>
		<h2 class="font-title text-2xl font-bold text-[var(--color-text)]">
			{d.settings.gatewayTitle}
		</h2>
		<p class="mt-1 text-sm text-[var(--color-muted)]">{d.settings.gatewayHint}</p>

		{#if flash || localFlash}
			<p
				class="mt-3 rounded-lg bg-[var(--color-primary)]/10 px-3 py-2 text-sm text-[var(--color-text)]"
				role="status"
			>
				{localFlash ?? flash}
			</p>
		{/if}
		{#if form?.error || localError}
			<p class="mt-3 text-sm text-[var(--color-danger)]" role="alert">
				{localError ?? form?.error}
			</p>
		{/if}
		{#if form?.success}
			<p class="mt-3 text-sm text-[var(--color-text)]" role="status">{form.success}</p>
		{/if}

		{#if !mpConfigured}
			<p class="mt-4 text-sm text-[var(--color-muted)]">{d.settings.gatewayNotConfigured}</p>
		{:else}
			<div class="mt-4 flex flex-col gap-4">
				<div
					class="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="min-w-0">
						<p class="font-semibold text-[var(--color-text)]">{d.settings.gatewayMercadoPago}</p>
						{#if connected}
							<p class="mt-0.5 text-sm text-[var(--color-muted)]">
								{d.settings.gatewayConnected}
								{#if account?.enabledPlanCount != null}
									· {d.settings.gatewayPlansSynced.replace(
										'{count}',
										String(account.enabledPlanCount)
									)}
								{/if}
							</p>
						{:else if account?.status === 'ERROR'}
							<p class="mt-0.5 text-sm text-[var(--color-danger)]">
								{d.settings.gatewayErrorStatus}
								{#if account.lastError}
									— {account.lastError}
								{/if}
							</p>
						{:else}
							<p class="mt-0.5 text-sm text-[var(--color-muted)]">
								{d.settings.gatewayDisconnectedHint}
							</p>
						{/if}
					</div>

					{#if canManage}
						<div class="flex flex-wrap gap-2">
							{#if !connected}
								<Button
									type="button"
									variant="primary"
									disabled={connectPending}
									aria-label={`${d.settings.gatewayConnect} ${d.settings.gatewayMercadoPago}`}
									onclick={openGatewayPopup}
								>
									{connectPending ? d.settings.gatewayConnecting : d.settings.gatewayConnect}
								</Button>
							{:else}
								<form
									method="POST"
									action="?/syncGateway"
									use:enhance={() => {
										syncPending = true;
										return async ({ update }) => {
											syncPending = false;
											await update();
										};
									}}
								>
									<input type="hidden" name="locale" value={locale} />
									<Button type="submit" variant="toolbar" disabled={syncPending}>
										{syncPending ? d.settings.gatewaySyncing : d.settings.gatewaySync}
									</Button>
								</form>
								<form
									method="POST"
									action="?/disconnectGateway"
									use:enhance={() => {
										disconnectPending = true;
										return async ({ update }) => {
											disconnectPending = false;
											await update();
										};
									}}
								>
									<input type="hidden" name="locale" value={locale} />
									<Button
										type="submit"
										variant="toolbarSecondary"
										disabled={disconnectPending}
									>
										{d.settings.gatewayDisconnect}
									</Button>
								</form>
							{/if}
						</div>
					{/if}
				</div>

				<p class="text-xs text-[var(--color-muted)]">{d.settings.gatewayManualStillWorks}</p>
			</div>
		{/if}
	</section>
{/if}
