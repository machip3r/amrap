<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { LoginState } from '$lib/server/auth/login';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		LIMITS,
		sanitizeEmailInput,
		sanitizePasswordInput
	} from '$lib/validation/schemas';

	type Props = {
		locale: Locale;
		d: Dictionary;
		form: LoginState;
	};

	let { locale, d, form }: Props = $props();

	let email = $state('');
	let password = $state('');
	let pending = $state(false);

	const emailId = 'login-email';
	const passwordId = 'login-password';
	const canSubmit = $derived(email.trim().length > 0 && password.length > 0);
	const fe = $derived(form?.fieldErrors);

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}
</script>

<div class="relative flex w-full flex-col gap-5" aria-busy={pending}>
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
				<p class="text-sm font-semibold text-[var(--color-text)]">{d.login.submitting}</p>
			</div>
		</div>
	{/if}

	<form
		method="POST"
		action="?/login"
		class="flex flex-col gap-4"
		novalidate
		use:enhance={() => {
			pending = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					await applyAction(result);
					await goto(result.location);
					return;
				}
				pending = false;
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<FormField label={d.login.email} htmlFor={emailId} error={fe?.email}>
			{#snippet children({ invalid, describedBy })}
				<Input
					id={emailId}
					name="email"
					type="email"
					autocomplete="email"
					inputmode="email"
					spellcheck={false}
					required
					maxlength={LIMITS.email}
					placeholder={d.login.emailPlaceholder}
					bind:value={email}
					{invalid}
					{describedBy}
					disabled={pending}
					oninput={(e) => {
						email = sanitizeEmailInput((e.currentTarget as HTMLInputElement).value);
					}}
				/>
			{/snippet}
		</FormField>

		<FormField label={d.login.password} htmlFor={passwordId} error={fe?.password}>
			{#snippet children({ invalid, describedBy })}
				<PasswordInput
					id={passwordId}
					name="password"
					autocomplete="current-password"
					maxlength={LIMITS.password.max}
					required
					placeholder={d.login.passwordPlaceholder}
					showLabel={d.login.showPassword}
					hideLabel={d.login.hidePassword}
					bind:value={password}
					{invalid}
					{describedBy}
					disabled={pending}
					oninput={(e) => {
						password = sanitizePasswordInput((e.currentTarget as HTMLInputElement).value);
					}}
				/>
			{/snippet}
		</FormField>

		{#if form?.error}
			<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{form.error}</p>
		{/if}

		<Button type="submit" variant="primaryBlock" disabled={pending || !canSubmit} class="gap-2">
			{#if pending}
				<Loader2 class="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
			{/if}
			{pending ? d.login.submitting : d.login.submit}
		</Button>
	</form>

	<div class="text-center">
		<p class="text-sm text-[var(--color-muted)]">
			{d.login.registerPrompt}
			<a
				href="/{locale}/register"
				class="font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
				aria-disabled={pending}
				tabindex={pending ? -1 : undefined}
			>
				{d.login.registerLink}
			</a>
		</p>
	</div>
</div>
