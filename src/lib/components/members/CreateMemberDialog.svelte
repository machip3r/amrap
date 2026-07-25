<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PhoneInput from '$lib/components/ui/PhoneInput.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import PaymentPricingFields from '$lib/components/payments/PaymentPricingFields.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import { DAY_PASS_PLAN_VALUE } from '$lib/members/day-pass';
	import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
	import type { PaymentPricingMode } from '$lib/payments/pricing';
	import type { CreateMemberState } from '$lib/server/members/actions';
	import { LIMITS, sanitizeEmailInput, sanitizePersonNameInput } from '$lib/validation/schemas';

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
		/** Gym day-pass price when configured; enables visit option in plan select. */
		dayPassPrice?: number | null;
		formResult: CreateMemberState;
		/** Form action path (default `?/create` on members page). */
		action?: string;
		onSuccess?: (
			memberId: string,
			meta?: { name: string; email: string }
		) => void;
	};

	let {
		open,
		onOpenChange,
		locale,
		d,
		plans,
		dayPassPrice = null,
		formResult,
		action = '?/create',
		onSuccess
	}: Props = $props();

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let planId = $state('');
	let pricingMode = $state<PaymentPricingMode>('FULL');
	let amount = $state('');
	let method = $state('CASH');
	let pending = $state(false);
	let localError = $state<string | undefined>(undefined);
	let localFieldErrors = $state<Record<string, string> | undefined>(undefined);
	let emailWarning = $state<string | undefined>(undefined);
	let softCapWarning = $state<string | undefined>(undefined);

	const fe = $derived(localFieldErrors);
	const hasDayPass = $derived(dayPassPrice != null);
	const hasPlanOptions = $derived(plans.length > 0 || hasDayPass);
	const listAmount = $derived.by(() => {
		if (planId === DAY_PASS_PLAN_VALUE) return Number(dayPassPrice ?? 0);
		const plan = plans.find((p) => p.id === planId);
		return plan?.price ?? plans[0]?.price ?? 0;
	});
	const canSubmit = $derived(
		name.trim().length > 0 &&
			email.trim().length > 0 &&
			planId.length > 0 &&
			hasPlanOptions &&
			(pricingMode !== 'DISCOUNT' ||
				(amount !== '' &&
					Number.isFinite(Number(amount)) &&
					Number(amount) >= 0 &&
					Number(amount) < listAmount)) &&
			!pending
	);

	const pricingLabels = $derived({
		pricingLabel: d.payments.pricingLabel,
		pricingFull: d.payments.pricingFull,
		pricingDiscount: d.payments.pricingDiscount,
		pricingTrial: d.payments.pricingTrial,
		pricingHint: d.payments.pricingHint,
		trialHint: d.payments.trialHint,
		discountHint: d.payments.discountHint,
		amount: d.payments.amount,
		listPrice: d.payments.listPrice
	});

	function formatPlanLabel(plan: ActivePlanOption) {
		const price = plan.price.toFixed(2);
		const meta = d.registerUser.planPrice
			.replace('{days}', String(plan.duration_days))
			.replace('{price}', price);
		return `${plan.name} — ${meta}`;
	}

	function formatDayPassLabel() {
		const price = Number(dayPassPrice ?? 0).toFixed(2);
		const meta = d.registerUser.planPrice.replace('{days}', '1').replace('{price}', price);
		return `${d.payments.kindDayPass} — ${meta}`;
	}

	function defaultPlanId() {
		if (plans[0]) return plans[0].id;
		if (hasDayPass) return DAY_PASS_PLAN_VALUE;
		return '';
	}

	function resetForm() {
		name = '';
		email = '';
		phone = '';
		planId = defaultPlanId();
		pricingMode = 'FULL';
		amount = String(listAmount || plans[0]?.price || dayPassPrice || '');
		method = 'CASH';
		localError = undefined;
		localFieldErrors = undefined;
		emailWarning = undefined;
		softCapWarning = undefined;
	}

	function onPlanChange(nextId: string) {
		planId = nextId;
		pricingMode = 'FULL';
		if (nextId === DAY_PASS_PLAN_VALUE) {
			amount = String(dayPassPrice ?? 0);
			return;
		}
		const plan = plans.find((p) => p.id === nextId);
		amount = plan != null ? String(plan.price) : '';
	}

	$effect(() => {
		if (open && !planId) {
			planId = defaultPlanId();
			amount = String(
				planId === DAY_PASS_PLAN_VALUE
					? (dayPassPrice ?? 0)
					: (plans.find((p) => p.id === planId)?.price ?? plans[0]?.price ?? 0)
			);
		}
	});
</script>

<Dialog
	{open}
	{onOpenChange}
	title={d.members.createTitle}
	description={d.registerUser.description}
	closeLabel={d.registerUser.close}
	autoFocus={false}
	class="max-w-2xl sm:max-w-3xl lg:max-w-4xl"
	bodyClass="px-6 py-5 sm:px-8 sm:py-7"
>
	{#if !hasPlanOptions}
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
			{action}
			class="flex flex-col gap-4"
			novalidate
			use:enhance={() => {
				pending = true;
				localError = undefined;
				localFieldErrors = undefined;
				emailWarning = undefined;
				softCapWarning = undefined;
				return async ({ result, update }) => {
					pending = false;
					if (result.type === 'success' || result.type === 'failure') {
						const data = result.data as CreateMemberState;
						if (data?.fieldErrors) localFieldErrors = data.fieldErrors;
						if (data?.error) localError = data.error;
						if (data?.emailWarning) emailWarning = data.emailWarning;
						if (data?.softCapWarning) softCapWarning = data.softCapWarning;
						if (data?.success && data.memberId) {
							onSuccess?.(data.memberId, {
								name: name.trim(),
								email: email.trim()
							});
							await invalidate(OPS_LOAD_DEPS.members);
							await invalidate(OPS_LOAD_DEPS.dashboard);
							await invalidate(OPS_LOAD_DEPS.payments);
							if (data.softCapWarning) {
								// Keep dialog open so the owner sees the soft-cap notice.
							} else {
								onOpenChange(false);
								resetForm();
							}
						}
					}
					await update({ reset: false, invalidateAll: false });
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
					<PhoneInput
						id="create-member-phone"
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
							onchange={(e) => onPlanChange((e.currentTarget as HTMLSelectElement).value)}
						>
							{#each plans as plan (plan.id)}
								<option value={plan.id}>{formatPlanLabel(plan)}</option>
							{/each}
							{#if hasDayPass}
								<option value={DAY_PASS_PLAN_VALUE}>{formatDayPassLabel()}</option>
							{/if}
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
							<option value="CASH">{d.members.cash}</option>
							<option value="TRANSFER">{d.members.transfer}</option>
						</Select>
					{/snippet}
				</FormField>
			</div>

			<PaymentPricingFields
				{locale}
				listAmount={listAmount}
				labels={pricingLabels}
				bind:mode={pricingMode}
				bind:amount
				amountError={fe?.amount}
				idPrefix="create-member-pricing"
			/>

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
			{#if softCapWarning}
				<p
					class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-[var(--color-text)]"
					role="status"
				>
					{softCapWarning}
				</p>
				<Button
					type="button"
					class="w-full"
					onclick={() => {
						onOpenChange(false);
						resetForm();
					}}
				>
					{d.registerUser.close}
				</Button>
			{/if}

			{#if !softCapWarning}
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
			{/if}
		</form>
	{/if}
</Dialog>
