<script lang="ts">
	import { enhance } from '$app/forms';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { InvitePasswordState } from '$lib/server/invite/actions';
	import { LIMITS, sanitizePasswordInput } from '$lib/validation/schemas';

	type Props = {
		locale: Locale;
		d: Dictionary;
		form: InvitePasswordState;
	};

	let { locale, d, form }: Props = $props();

	let password = $state('');
	let confirm = $state('');
	let pending = $state(false);

	const canSubmit = $derived(
		password.length >= LIMITS.password.min && confirm.length > 0 && !pending
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
				<p class="text-sm font-semibold text-[var(--color-text)]">
					{d.invite.passwordSubmitting}
				</p>
			</div>
		</div>
	{/if}

	<form
		method="POST"
		action="?/setPassword"
		class="flex flex-col gap-4"
		novalidate
		use:enhance={() => {
			pending = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					await update();
					return;
				}
				pending = false;
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<FormField label={d.invite.password} htmlFor="password" error={form?.fieldErrors?.password}>
			{#snippet children({ invalid, describedBy })}
				<PasswordInput
					id="password"
					required
					name="password"
					autocomplete="new-password"
					maxlength={LIMITS.password.max}
					placeholder={d.login.passwordPlaceholder}
					showLabel={d.login.showPassword}
					hideLabel={d.login.hidePassword}
					bind:value={password}
					disabled={pending}
					oninput={(event) => {
						password = sanitizePasswordInput((event.target as HTMLInputElement).value);
					}}
					{invalid}
					{describedBy}
				/>
			{/snippet}
		</FormField>
		<FormField label={d.invite.confirmPassword} htmlFor="confirm" error={form?.fieldErrors?.confirm}>
			{#snippet children({ invalid, describedBy })}
				<PasswordInput
					id="confirm"
					required
					name="confirm"
					autocomplete="new-password"
					maxlength={LIMITS.password.max}
					placeholder={d.login.passwordPlaceholder}
					showLabel={d.login.showPassword}
					hideLabel={d.login.hidePassword}
					bind:value={confirm}
					disabled={pending}
					oninput={(event) => {
						confirm = sanitizePasswordInput((event.target as HTMLInputElement).value);
					}}
					{invalid}
					{describedBy}
				/>
			{/snippet}
		</FormField>
		{#if form?.error}
			<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{form.error}</p>
		{/if}
		<Button type="submit" class="w-full gap-2" disabled={!canSubmit}>
			{#if pending}
				<Loader2 class="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
			{/if}
			{pending ? d.invite.passwordSubmitting : d.invite.passwordSubmit}
		</Button>
	</form>
</div>
