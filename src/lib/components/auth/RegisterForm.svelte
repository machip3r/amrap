<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { RegisterState } from '$lib/server/auth/register';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		LIMITS,
		sanitizeEmailInput,
		sanitizeEntityNameInput,
		sanitizePasswordInput
	} from '$lib/validation/schemas';

	type Props = {
		locale: Locale;
		d: Dictionary;
		form: RegisterState;
	};

	let { locale, d, form }: Props = $props();

	let organizationName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let pending = $state(false);

	const orgId = 'register-org';
	const emailId = 'register-email';
	const passwordId = 'register-password';
	const confirmId = 'register-confirm';

	const canSubmit = $derived(
		organizationName.trim().length > 0 &&
			email.trim().length > 0 &&
			password.length > 0 &&
			confirmPassword.length > 0
	);
	const fe = $derived(form?.fieldErrors);
</script>

<div class="flex w-full flex-col gap-5">
	<form
		method="POST"
		action="?/register"
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

		<FormField label={d.register.organizationName} htmlFor={orgId} error={fe?.organizationName}>
			{#snippet children({ invalid, describedBy })}
				<Input
					id={orgId}
					name="organizationName"
					autocomplete="organization"
					required
					maxlength={LIMITS.entityName}
					placeholder={d.register.organizationNamePlaceholder}
					bind:value={organizationName}
					{invalid}
					{describedBy}
					oninput={(e) => {
						organizationName = sanitizeEntityNameInput(
							(e.currentTarget as HTMLInputElement).value
						);
					}}
				/>
			{/snippet}
		</FormField>

		<FormField label={d.register.email} htmlFor={emailId} error={fe?.email}>
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
					placeholder={d.register.emailPlaceholder}
					bind:value={email}
					{invalid}
					{describedBy}
					oninput={(e) => {
						email = sanitizeEmailInput((e.currentTarget as HTMLInputElement).value);
					}}
				/>
			{/snippet}
		</FormField>

		<FormField label={d.register.password} htmlFor={passwordId} error={fe?.password}>
			{#snippet children({ invalid, describedBy })}
				<PasswordInput
					id={passwordId}
					name="password"
					autocomplete="new-password"
					minlength={LIMITS.password.min}
					maxlength={LIMITS.password.max}
					required
					showLabel={d.register.showPassword}
					hideLabel={d.register.hidePassword}
					bind:value={password}
					{invalid}
					{describedBy}
					oninput={(e) => {
						password = sanitizePasswordInput((e.currentTarget as HTMLInputElement).value);
					}}
				/>
			{/snippet}
		</FormField>

		<FormField label={d.register.confirmPassword} htmlFor={confirmId} error={fe?.confirmPassword}>
			{#snippet children({ invalid, describedBy })}
				<PasswordInput
					id={confirmId}
					name="confirmPassword"
					autocomplete="new-password"
					minlength={LIMITS.password.min}
					maxlength={LIMITS.password.max}
					required
					showLabel={d.register.showPassword}
					hideLabel={d.register.hidePassword}
					bind:value={confirmPassword}
					{invalid}
					{describedBy}
					oninput={(e) => {
						confirmPassword = sanitizePasswordInput(
							(e.currentTarget as HTMLInputElement).value
						);
					}}
				/>
			{/snippet}
		</FormField>

		{#if form?.error}
			<p
				class="whitespace-pre-wrap rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
				role="alert"
			>
				{form.error}
			</p>
		{/if}

		<Button type="submit" variant="primaryBlock" disabled={pending || !canSubmit}>
			{pending ? d.register.submitting : d.register.submit}
		</Button>
	</form>

	<div class="text-center">
		<p class="text-sm text-[var(--color-muted)]">
			{d.register.loginPrompt}
			<a
				href="/{locale}/login"
				class="font-semibold text-[var(--color-text)] transition-colors duration-200 hover:text-[var(--color-primary)]"
			>
				{d.register.loginLink}
			</a>
		</p>
	</div>
</div>
