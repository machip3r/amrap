<script lang="ts">
	import { enhance } from '$app/forms';
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
</script>

<div class="flex w-full flex-col gap-5">
	<form
		method="POST"
		action="?/login"
		class="flex flex-col gap-4"
		novalidate
		use:enhance={() => {
			pending = true;
			return async ({ update }) => {
				pending = false;
				await update();
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
					showLabel={d.login.showPassword}
					hideLabel={d.login.hidePassword}
					bind:value={password}
					{invalid}
					{describedBy}
					oninput={(e) => {
						password = sanitizePasswordInput((e.currentTarget as HTMLInputElement).value);
					}}
				/>
			{/snippet}
		</FormField>

		{#if form?.error}
			<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{form.error}</p>
		{/if}

		<Button type="submit" variant="primaryBlock" disabled={pending || !canSubmit}>
			{pending ? d.login.submitting : d.login.submit}
		</Button>
	</form>

	<div class="text-center">
		<p class="text-sm text-[var(--color-muted)]">
			{d.login.registerPrompt}
			<a
				href="/{locale}/register"
				class="font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
			>
				{d.login.registerLink}
			</a>
		</p>
	</div>
</div>
