<script lang="ts">
	import { enhance } from '$app/forms';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { CreateTeamMemberState } from '$lib/server/team/actions';
	import {
		LIMITS,
		sanitizeEmailInput,
		sanitizePersonNameInput,
		sanitizePhoneInput
	} from '$lib/validation/schemas';

	type TeamInviteRole = 'trainer' | 'staff';

	type Props = {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		locale: Locale;
		d: Dictionary;
		role: TeamInviteRole;
		formResult: CreateTeamMemberState;
		onSuccess?: (teamMemberId: string) => void;
	};

	let { open, onOpenChange, locale, d, role, formResult, onSuccess }: Props = $props();

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let pending = $state(false);
	let localError = $state<string | undefined>(undefined);
	let localFieldErrors = $state<Record<string, string> | undefined>(undefined);
	let emailWarning = $state<string | undefined>(undefined);

	const fe = $derived(localFieldErrors);
	const canSubmit = $derived(name.trim().length > 0 && email.trim().length > 0 && !pending);
	const title = $derived(role === 'trainer' ? d.trainers.newTrainer : d.staffPage.newStaff);

	function resetForm() {
		name = '';
		email = '';
		phone = '';
		localError = undefined;
		localFieldErrors = undefined;
		emailWarning = undefined;
	}
</script>

<Dialog
	{open}
	{onOpenChange}
	{title}
	description={d.registerUser.description}
	closeLabel={d.registerUser.close}
>
	<form
		method="POST"
		action="?/create"
		class="flex flex-col gap-4"
		novalidate
		use:enhance={() => {
			pending = true;
			localError = undefined;
			localFieldErrors = undefined;
			emailWarning = undefined;
			return async ({ result, update }) => {
				pending = false;
				if (result.type === 'success' || result.type === 'failure') {
					const data = result.data as CreateTeamMemberState;
					if (data?.fieldErrors) localFieldErrors = data.fieldErrors;
					if (data?.error) localError = data.error;
					if (data?.emailWarning) emailWarning = data.emailWarning;
					if (data?.success && data.teamMemberId) {
						onSuccess?.(data.teamMemberId);
						if (!data.emailWarning) {
							onOpenChange(false);
							resetForm();
						}
					}
				}
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="role" value={role} />
		<div class="grid gap-4 sm:grid-cols-2">
			<FormField label={d.members.name} htmlFor="create-team-name" error={fe?.name}>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="create-team-name"
						name="name"
						required
						maxlength={LIMITS.personName}
						autocomplete="name"
						placeholder={d.registerUser.namePlaceholder}
						bind:value={name}
						{invalid}
						{describedBy}
						oninput={(e) => {
							name = sanitizePersonNameInput((e.currentTarget as HTMLInputElement).value);
						}}
					/>
				{/snippet}
			</FormField>
			<FormField label={d.registerUser.email} htmlFor="create-team-email" error={fe?.email}>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="create-team-email"
						name="email"
						type="email"
						required
						maxlength={LIMITS.email}
						autocomplete="email"
						inputmode="email"
						spellcheck={false}
						placeholder={d.registerUser.emailPlaceholder}
						bind:value={email}
						{invalid}
						{describedBy}
						oninput={(e) => {
							email = sanitizeEmailInput((e.currentTarget as HTMLInputElement).value);
						}}
					/>
				{/snippet}
			</FormField>
		</div>
		<FormField label={d.members.phone} htmlFor="create-team-phone" error={fe?.phone}>
			{#snippet children({ invalid, describedBy })}
				<Input
					id="create-team-phone"
					name="phone"
					type="tel"
					maxlength={LIMITS.phone}
					inputmode="numeric"
					placeholder={d.registerUser.phonePlaceholder}
					bind:value={phone}
					{invalid}
					{describedBy}
					oninput={(e) => {
						phone = sanitizePhoneInput((e.currentTarget as HTMLInputElement).value);
					}}
				/>
			{/snippet}
		</FormField>

		{#if localError || formResult?.error}
			<p
				class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-primary)]"
				role="alert"
			>
				{localError ?? formResult?.error}
			</p>
		{/if}
		{#if emailWarning}
			<p
				class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-muted)]"
				role="status"
			>
				{emailWarning}
			</p>
		{/if}

		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button
				type="button"
				variant="ghost"
				class="rounded-lg px-4 py-2.5 text-sm font-semibold"
				onclick={() => onOpenChange(false)}
			>
				{d.registerUser.cancel}
			</Button>
			<Button type="submit" disabled={!canSubmit}>
				{pending ? d.registerUser.submitting : d.registerUser.submit}
			</Button>
		</div>
	</form>
</Dialog>
