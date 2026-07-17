<script lang="ts">
	import { enhance } from '$app/forms';
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

	function submitIfComplete(code: string) {
		if (code.length !== 6 || verifyPending || !verifyFormEl) return;
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

<div class="flex w-full flex-col gap-5">
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
			return async ({ update }) => {
				verifyPending = false;
				await update();
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
			disabled={verifyPending}
			error={otpError}
		/>

		{#if error}
			<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{error}</p>
		{/if}
		{#if success}
			<p class="text-sm font-medium text-[var(--color-success)]" role="status">{success}</p>
		{/if}

		<Button type="submit" variant="primaryBlock" disabled={verifyPending || !canVerify}>
			{verifyPending ? d.confirmEmail.verifying : d.confirmEmail.verify}
		</Button>
	</form>

	<form
		method="POST"
		action="?/resendOtp"
		class="flex flex-col gap-2"
		use:enhance={() => {
			resendPending = true;
			return async ({ update }) => {
				resendPending = false;
				await update();
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="email" value={displayEmail} />
		<Button type="submit" variant="ghost" class="w-full py-2 text-sm" disabled={resendPending}>
			{resendPending ? d.confirmEmail.resending : d.confirmEmail.resend}
		</Button>
	</form>

	<form method="POST" action="?/clearPending" class="text-center" use:enhance>
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="from" value={from} />
		<p class="text-sm text-[var(--color-muted)]">
			{d.confirmEmail.backToLoginPrompt}
			<Button type="submit" variant="link" class="inline p-0 align-baseline">
				{d.confirmEmail.backToLoginLink}
			</Button>
		</p>
	</form>
</div>
