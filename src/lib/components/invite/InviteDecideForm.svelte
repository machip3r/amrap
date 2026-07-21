<script lang="ts">
	import { enhance } from '$app/forms';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { InviteDecideState } from '$lib/server/invite/actions';

	type Props = {
		locale: Locale;
		d: Dictionary;
		form: InviteDecideState;
	};

	let { locale, d, form }: Props = $props();

	let acceptPending = $state(false);
	let declinePending = $state(false);
	const pending = $derived(acceptPending || declinePending);
	const statusLabel = $derived(
		acceptPending ? d.invite.accepting : declinePending ? d.invite.declining : ''
	);

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}
</script>

<div class="relative flex flex-col gap-4" aria-busy={pending}>
	{#if pending}
		<div
			use:portal
			class="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-text)]/40 px-6 backdrop-blur-[2px]"
			role="status"
			aria-live="polite"
		>
			<div
				class="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-6 shadow-xl"
			>
				<Loader2
					class="h-8 w-8 animate-spin text-[var(--color-primary)]"
					aria-hidden="true"
				/>
				<p class="text-sm font-semibold text-[var(--color-text)]">{statusLabel}</p>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{form.error}</p>
	{/if}
	<form
		method="POST"
		action="?/accept"
		use:enhance={() => {
			acceptPending = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					await update();
					return;
				}
				acceptPending = false;
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<Button type="submit" class="w-full gap-2" disabled={pending}>
			{#if acceptPending}
				<Loader2 class="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
			{/if}
			{acceptPending ? d.invite.accepting : d.invite.accept}
		</Button>
	</form>
	<form
		method="POST"
		action="?/decline"
		use:enhance={() => {
			declinePending = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					await update();
					return;
				}
				declinePending = false;
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<Button type="submit" variant="ghost" class="w-full gap-2" disabled={pending}>
			{#if declinePending}
				<Loader2 class="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
			{/if}
			{declinePending ? d.invite.declining : d.invite.decline}
		</Button>
	</form>
</div>
