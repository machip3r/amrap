<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { ConfirmEmailState } from '$lib/server/auth/confirm-email';
	import OtpDigitsInput from '$lib/components/ui/OtpDigitsInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Props = {
		locale: Locale;
		d: Dictionary;
		email: string;
		form: ConfirmEmailState;
		from?: 'login' | 'register';
	};

	let { locale, d, email, form, from = 'login' }: Props = $props();

	let otp = $state('');
	let verifyPending = $state(false);
	let resendPending = $state(false);
	let verifyFormEl: HTMLFormElement | undefined = $state();
	let lastSuccess = $state<string | undefined>(undefined);

	const displayEmail = $derived(form?.email || email);
	const error = $derived(form?.error);
	const otpError = $derived(form?.fieldErrors?.otp);
	const success = $derived(form?.success ?? lastSuccess);
	const canVerify = $derived(otp.length === 6);
	const busy = $derived(verifyPending || resendPending);

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	function submitIfComplete(code: string) {
		if (code.length !== 6 || busy || !verifyFormEl) return;
		otp = code;
		requestAnimationFrame(() => verifyFormEl?.requestSubmit());
	}

	$effect(() => {
		if (form?.fieldErrors?.otp || form?.error) {
			otp = '';
		}
		if (form?.success) {
			lastSuccess = form.success;
		}
	});
</script>

<div class="relative flex w-full flex-col gap-5" aria-busy={busy}>
	{#if verifyPending}
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
				<p class="text-sm font-semibold text-[var(--color-text)]">{d.confirmEmail.verifying}</p>
			</div>
		</div>
	{/if}

	<div
		class="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-text)]"
	>
		<p class="font-medium">{d.confirmEmail.sentTitle}</p>
		<p class="mt-1 text-[var(--color-muted)]">
			{d.confirmEmail.sentBody}
			<span class="font-semibold text-[var(--color-text)]">{displayEmail}</span>
		</p>
	</div>

	<form
		bind:this={verifyFormEl}
		method="POST"
		action="?/verifyOtp"
		class="flex flex-col gap-4"
		novalidate
		use:enhance={() => {
			verifyPending = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					await applyAction(result);
					await goto(result.location);
					return;
				}
				verifyPending = false;
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="email" value={displayEmail} />
		<input type="hidden" name="otp" value={otp} />

		<OtpDigitsInput
			label={d.confirmEmail.otpLabel}
			bind:value={otp}
			oncomplete={submitIfComplete}
			disabled={busy}
			error={otpError}
		/>

		{#if error}
			<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{error}</p>
		{/if}
		{#if success}
			<p class="text-sm font-medium text-[var(--color-success)]" role="status">{success}</p>
		{/if}

		<Button type="submit" variant="primaryBlock" disabled={busy || !canVerify}>
			{verifyPending ? d.confirmEmail.verifying : d.confirmEmail.verify}
		</Button>
	</form>

	<form
		method="POST"
		action="?/resendOtp"
		class="flex flex-col gap-2"
		use:enhance={() => {
			resendPending = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					await update();
					return;
				}
				resendPending = false;
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="email" value={displayEmail} />
		<Button type="submit" variant="ghost" class="w-full py-2 text-sm" disabled={busy}>
			{resendPending ? d.confirmEmail.resending : d.confirmEmail.resend}
		</Button>
	</form>

	<form method="POST" action="?/clearPending" class="text-center" use:enhance>
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="from" value={from} />
		<p class="text-sm text-[var(--color-muted)]">
			{d.confirmEmail.backToLoginPrompt}
			<Button type="submit" variant="link" class="inline p-0 align-baseline" disabled={busy}>
				{d.confirmEmail.backToLoginLink}
			</Button>
		</p>
	</form>
</div>
