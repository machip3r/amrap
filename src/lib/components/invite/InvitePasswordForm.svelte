<script lang="ts">
	import { enhance } from '$app/forms';
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
</script>

<form
	method="POST"
	action="?/setPassword"
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
	<FormField label={d.invite.password} htmlFor="password" error={form?.fieldErrors?.password}>
		{#snippet children({ invalid, describedBy })}
			<PasswordInput
				id="password"
				required
				name="password"
				autocomplete="new-password"
				maxlength={LIMITS.password.max}
				placeholder="••••••••"
				showLabel={d.login.showPassword}
				hideLabel={d.login.hidePassword}
				bind:value={password}
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
				placeholder="••••••••"
				showLabel={d.login.showPassword}
				hideLabel={d.login.hidePassword}
				bind:value={confirm}
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
	<Button type="submit" class="w-full" disabled={!canSubmit}>
		{pending ? d.invite.passwordSubmitting : d.invite.passwordSubmit}
	</Button>
</form>
