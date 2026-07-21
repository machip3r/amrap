<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PhoneInput from '$lib/components/ui/PhoneInput.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { CreateTeamMemberState } from '$lib/server/team/actions';
	import { LIMITS, sanitizeEmailInput, sanitizePersonNameInput } from '$lib/validation/schemas';

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
	class="max-w-2xl sm:max-w-3xl lg:max-w-4xl"
	bodyClass="px-6 py-5 sm:px-8 sm:py-7"
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
						onOpenChange(false);
						resetForm();
						await invalidate(OPS_LOAD_DEPS.team);
					}
				}
				await update({ reset: false, invalidateAll: false });
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
				<PhoneInput
					id="create-team-phone"
					name="phone"
					{locale}
					countryLabel={d.registerUser.countryCode}
					placeholder={d.registerUser.phonePlaceholder}
					bind:value={phone}
					{invalid}
					{describedBy}
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

		<div class="flex w-full gap-2">
			<Button
				type="button"
				variant="ghost"
				class="min-h-11 min-w-0 flex-1 border border-[var(--color-border)] px-3 text-sm font-semibold"
				onclick={() => onOpenChange(false)}
			>
				{d.registerUser.cancel}
			</Button>
			<Button type="submit" class="min-h-11 min-w-0 flex-1" disabled={!canSubmit}>
				{pending ? d.registerUser.submitting : d.registerUser.submit}
			</Button>
		</div>
	</form>
</Dialog>
