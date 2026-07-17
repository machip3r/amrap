<script lang="ts">
	import { enhance } from '$app/forms';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { CreateMemberState } from '$lib/server/members/actions';
	import {
		LIMITS,
		sanitizeEmailInput,
		sanitizePersonNameInput,
		sanitizePhoneInput
	} from '$lib/validation/schemas';

	export type ActivePlanOption = {
		id: string;
		name: string;
		price: number;
		duration_days: number;
	};

	type Props = {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		locale: Locale;
		d: Dictionary;
		plans: ActivePlanOption[];
		formResult: CreateMemberState;
		onSuccess?: (memberId: string) => void;
	};

	let {
		open,
		onOpenChange,
		locale,
		d,
		plans,
		formResult,
		onSuccess
	}: Props = $props();

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let planId = $state('');
	let method = $state('cash');
	let pending = $state(false);
	let localError = $state<string | undefined>(undefined);
	let localFieldErrors = $state<Record<string, string> | undefined>(undefined);
	let emailWarning = $state<string | undefined>(undefined);

	const fe = $derived(localFieldErrors);
	const canSubmit = $derived(
		name.trim().length > 0 &&
			email.trim().length > 0 &&
			planId.length > 0 &&
			!pending
	);

	function formatPlanLabel(plan: ActivePlanOption) {
		const price = plan.price.toFixed(2);
		const meta = d.registerUser.planPrice
			.replace('{days}', String(plan.duration_days))
			.replace('{price}', price);
		return `${plan.name} — ${meta}`;
	}

	function resetForm() {
		name = '';
		email = '';
		phone = '';
		planId = plans[0]?.id ?? '';
		method = 'cash';
		localError = undefined;
		localFieldErrors = undefined;
		emailWarning = undefined;
	}

	$effect(() => {
		if (open && !planId && plans[0]) {
			planId = plans[0].id;
		}
	});
</script>

<Dialog
	{open}
	{onOpenChange}
	title={d.members.createTitle}
	description={d.registerUser.description}
	closeLabel={d.registerUser.close}
>
	{#if plans.length === 0}
		<div class="flex flex-col gap-4">
			<p
				class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-3 text-sm text-[var(--color-muted)]"
				role="status"
			>
				{d.registerUser.noPlans}
			</p>
			<button
				type="button"
				onclick={() => onOpenChange(false)}
				class="text-center text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				{d.registerUser.cancel}
			</button>
		</div>
	{:else}
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
						const data = result.data as CreateMemberState;
						if (data?.fieldErrors) localFieldErrors = data.fieldErrors;
						if (data?.error) localError = data.error;
						if (data?.emailWarning) emailWarning = data.emailWarning;
						if (data?.success && data.memberId) {
							onSuccess?.(data.memberId);
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
			<div class="grid gap-4 sm:grid-cols-2">
				<FormField label={d.members.name} htmlFor="create-member-name" error={fe?.name}>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="create-member-name"
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
				<FormField label={d.registerUser.email} htmlFor="create-member-email" error={fe?.email}>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="create-member-email"
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
			<FormField label={d.members.phone} htmlFor="create-member-phone" error={fe?.phone}>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="create-member-phone"
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
			<div class="grid gap-4 sm:grid-cols-2">
				<FormField label={d.members.selectPlan} htmlFor="create-member-plan" error={fe?.plan_id}>
					{#snippet children({ invalid, describedBy })}
						<Select
							id="create-member-plan"
							name="plan_id"
							required
							bind:value={planId}
							{invalid}
							{describedBy}
						>
							{#each plans as plan (plan.id)}
								<option value={plan.id}>{formatPlanLabel(plan)}</option>
							{/each}
						</Select>
					{/snippet}
				</FormField>
				<FormField label={d.members.paymentMethod} htmlFor="create-member-method" error={fe?.method}>
					{#snippet children({ invalid, describedBy })}
						<Select
							id="create-member-method"
							name="method"
							bind:value={method}
							{invalid}
							{describedBy}
						>
							<option value="cash">{d.members.cash}</option>
							<option value="transfer">{d.members.transfer}</option>
						</Select>
					{/snippet}
				</FormField>
			</div>

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
				<Button type="button" variant="ghost" class="rounded-lg px-4 py-2.5 text-sm font-semibold" onclick={() => onOpenChange(false)}>
					{d.registerUser.cancel}
				</Button>
				<Button type="submit" disabled={!canSubmit}>
					{pending ? d.registerUser.submitting : d.registerUser.submit}
				</Button>
			</div>
		</form>
	{/if}
</Dialog>
