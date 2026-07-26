<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { tick } from 'svelte';
	import type { OnboardingState, OnboardingStep } from '$lib/auth/session';
	import EmbeddedCheckoutDialog from '$lib/components/billing/EmbeddedCheckoutDialog.svelte';
	import PlanCompareDialog from '$lib/components/billing/PlanCompareDialog.svelte';
	import UpgradeConfirmDialog from '$lib/components/billing/UpgradeConfirmDialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import DigitInput from '$lib/components/ui/DigitInput.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { formatMoney } from '$lib/i18n/money';
	import { AMRAP_PLANS, canCreatePlan } from '$lib/plans/limits';
	import type { OnboardingActionState } from '$lib/server/onboarding/actions';
	import type { OrgActionState } from '$lib/server/organization/billing';
	import type { OrgPlanTier } from '$lib/types';
	import {
		LIMITS,
		parseClampedAmount,
		sanitizeDecimalInput
	} from '$lib/validation/schemas';

	type PlanRow = { id: string; name: string; price: number; duration_days: number };

	type Props = {
		locale: Locale;
		onboardingState: OnboardingState;
		plans: PlanRow[];
		dayPassPrice?: number | null;
		planTier?: OrgPlanTier;
		planCap?: number | null;
		stripePublishableKey?: string | null;
		billingFlash?: boolean;
		showError?: boolean;
		form: OnboardingActionState;
	};

	let {
		locale,
		onboardingState,
		plans,
		dayPassPrice = null,
		planTier = 'FREEMIUM',
		planCap = 2,
		stripePublishableKey = null,
		billingFlash = false,
		showError = false,
		form
	}: Props = $props();

	const d = getDictionary(locale);
	const maxStep = $derived(onboardingState.step);
	let viewStep = $state(onboardingState.step as OnboardingStep);
	let prevMaxStep = $state(onboardingState.step);

	let compareOpen = $state(false);
	let upgradeTier = $state<OrgPlanTier | null>(null);
	let checkoutClientSecret = $state<string | null>(null);
	let billingMessage = $state<string | undefined>(undefined);

	$effect(() => {
		if (maxStep !== prevMaxStep) {
			prevMaxStep = maxStep;
			viewStep = maxStep;
		}
	});

	function goBack() {
		viewStep = viewStep > 1 ? ((viewStep - 1) as OnboardingStep) : viewStep;
	}

	/** After saving a revisited step, maxStep often does not change — nudge the UI forward. */
	function advanceViewStepAfterSave() {
		if (viewStep < maxStep) {
			viewStep = (viewStep + 1) as OnboardingStep;
		}
	}

	function formatDayPassAmount(price: number) {
		return `$${Number(price).toFixed(price % 1 === 0 ? 0 : 2)}`;
	}

	function scrollDayPassFormIntoView() {
		const el =
			document.getElementById('onboarding-day-pass-form') ??
			document.getElementById('onboarding-day-pass');
		if (!el) return;

		const scroller = el.closest('.overflow-y-auto');
		if (scroller instanceof HTMLElement) {
			const scrollerRect = scroller.getBoundingClientRect();
			const elRect = el.getBoundingClientRect();
			const offset =
				elRect.top - scrollerRect.top - scrollerRect.height / 2 + elRect.height / 2;
			scroller.scrollTo({ top: scroller.scrollTop + offset, behavior: 'smooth' });
		} else {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}

		window.setTimeout(() => {
			const input = document.getElementById('onboarding-day-pass');
			if (input instanceof HTMLInputElement) input.focus({ preventScroll: true });
		}, 350);
	}

	async function openDayPassEditor() {
		if (!dayPassOpen) {
			dayPassOpen = true;
			dayPassDraft = dayPassPrice != null ? String(dayPassPrice) : '';
			await tick();
		}
		scrollDayPassFormIntoView();
	}

	$effect(() => {
		if (editingId) {
			const plan = plans.find((p) => p.id === editingId);
			if (plan) {
				editPlanPrice = String(plan.price);
				editPlanDuration = plan.duration_days;
			}
		}
	});

	function stepLabel(n: number) {
		if (n === 1) return d.onboarding.stepYou;
		if (n === 2) return d.onboarding.stepGym;
		if (n === 3) return d.onboarding.stepPlans;
		if (n === 4) return d.onboarding.stepBilling;
		return d.onboarding.stepDone;
	}

	function planDisplayName(tier: OrgPlanTier) {
		switch (tier) {
			case 'STARTER':
				return d.organization.planStarter;
			case 'GROWTH':
				return d.organization.planGrowth;
			case 'PRO':
				return d.organization.planPro;
			default:
				return d.organization.planFreemium;
		}
	}

	function priceLine(tier: OrgPlanTier) {
		const plan = AMRAP_PLANS.find((p) => p.tier === tier)!;
		if (plan.priceNote === 'free') return formatMoney(0, locale);
		if (plan.priceNote === 'contact') return d.organization.priceContact;
		const amount = locale === 'en' ? (plan.priceUsdMonthly ?? 0) : (plan.priceMxnMonthly ?? 0);
		return `${formatMoney(amount, locale)}${d.organization.perMonth}`;
	}

	function onCheckoutResult(data: OrgActionState) {
		if (!data) return;
		if (data.error) billingMessage = data.error;
		if (data.message) billingMessage = data.message;
		if (data.clientSecret) checkoutClientSecret = data.clientSecret;
	}

	const upgradeLabels = $derived({
		upgradeConfirmTitle: d.organization.upgradeConfirmTitle,
		upgradeConfirmDescription: d.organization.upgradeConfirmDescription,
		changeConfirmTitle: d.organization.changeConfirmTitle,
		changeConfirmDescription: d.organization.changeConfirmDescription,
		upgradeConfirmSubmit: d.organization.upgradeConfirmSubmit,
		changeConfirmSubmit: d.organization.changeConfirmSubmit,
		billingIntervalLabel: d.organization.billingIntervalLabel,
		billingMonthly: d.organization.billingMonthly,
		billingMonthlyHint: d.organization.billingMonthlyHint,
		billingAnnual: d.organization.billingAnnual,
		billingAnnualHint: d.organization.billingAnnualHint,
		billingAnnualSaveBadge: d.organization.billingAnnualSaveBadge,
		perMonth: d.organization.perMonth,
		perYear: d.organization.perYear,
		cancel: d.organization.cancel,
		close: d.organization.close,
		save: d.organization.save
	});

	const compareLabels = $derived({
		title: d.planCompare.title,
		description: d.planCompare.description,
		close: d.organization.close,
		tierFreemium: d.organization.planFreemium,
		tierStarter: d.organization.planStarter,
		tierGrowth: d.organization.planGrowth,
		tierPro: d.organization.planPro,
		featureGyms: d.planCompare.featureGyms,
		featureMembers: d.planCompare.featureMembers,
		featureStaff: d.planCompare.featureStaff,
		featurePackages: d.planCompare.featurePackages,
		featureBranding: d.planCompare.featureBranding,
		featureWatermark: d.planCompare.featureWatermark,
		featureMultiGym: d.planCompare.featureMultiGym,
		featureOnlineBilling: d.planCompare.featureOnlineBilling,
		valueYes: d.planCompare.valueYes,
		valueNo: d.planCompare.valueNo,
		valueLimited: d.planCompare.valueLimited,
		valueSoon: d.planCompare.valueSoon
	});

	let profilePending = $state(false);
	let gymPending = $state(false);
	let addPlanPending = $state(false);
	let editPlanPending = $state(false);
	let dayPassPending = $state(false);
	let dayPassOpen = $state(false);
	let dayPassDraft = $state('');
	let addPlanPrice = $state('');
	let addPlanDuration = $state(30);
	let editPlanPrice = $state('');
	let editPlanDuration = $state(30);
	let skipPlansPending = $state(false);
	let skipBillingPending = $state(false);
	let finishPending = $state(false);
	let editingId = $state(null as string | null);
	let deleting = $state(null as PlanRow | null);

	const primaryPending = $derived(
		profilePending ||
			gymPending ||
			skipPlansPending ||
			skipBillingPending ||
			finishPending
	);
	const anyPending = $derived(
		primaryPending || addPlanPending || editPlanPending || dayPassPending
	);

	/** Keep pending until redirect/load finishes — clearing early re-enables buttons mid-wait. */
	function pendingEnhance(
		setPending: (value: boolean) => void,
		opts?: { leavePage?: boolean; onSuccess?: () => void }
	): SubmitFunction {
		return () => {
			setPending(true);
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					if (opts?.leavePage) {
						await applyAction(result);
						await goto(result.location);
						return;
					}
					await update();
					opts?.onSuccess?.();
					setPending(false);
					return;
				}
				await update({ reset: false });
				setPending(false);
			};
		};
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	const primaryFormId = $derived(
		viewStep === 1
			? 'onboarding-profile'
			: viewStep === 2
				? 'onboarding-gym'
				: viewStep === 3
					? 'onboarding-skip-plans'
					: viewStep === 4
						? 'onboarding-skip-billing'
						: 'onboarding-finish'
	);

	const primaryLabel = $derived(
		primaryPending
			? d.onboarding.saving
			: viewStep === 1
				? d.onboarding.continue
				: viewStep === 2
					? d.onboarding.continue
					: viewStep === 3
						? plans.length > 0
							? d.onboarding.continue
							: d.onboarding.skipPlans
						: viewStep === 4
							? d.onboarding.billingSkip
							: d.onboarding.goDashboard
	);

	const dayPassToggleLabel = $derived(
		dayPassOpen ? d.onboarding.hideDayPass : d.onboarding.setDayPass
	);
</script>

<div class="flex min-h-0 w-full flex-1 flex-col" aria-busy={anyPending}>
	{#if anyPending}
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
				<p class="text-sm font-semibold text-[var(--color-text)]">{d.onboarding.saving}</p>
			</div>
		</div>
	{/if}
	<nav aria-label={d.onboarding.stepsLabel} class="mb-6 flex shrink-0 gap-1.5 sm:mb-8 sm:gap-2">
		{#each [1, 2, 3, 4, 5] as n (n)}
			{@const active = viewStep === n}
			{@const reached = maxStep >= n}
			<button
				type="button"
				disabled={!reached || anyPending}
				onclick={() => (viewStep = n as OnboardingStep)}
				class="flex flex-1 flex-col gap-1 text-left {active
					? 'opacity-100'
					: reached
						? 'opacity-70'
						: 'opacity-40'} {reached && !anyPending ? 'cursor-pointer' : 'cursor-default'}"
			>
				<div
					class="h-1 rounded-full {reached
						? 'bg-[var(--color-primary)]'
						: 'bg-[var(--color-muted)]/30'}"
				></div>
				<span class="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-muted)] sm:text-[10px]">
					{stepLabel(n)}
				</span>
			</button>
		{/each}
	</nav>

	{#if showError}
		<p
			class="mb-4 shrink-0 rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
		>
			{d.onboarding.errorSave}
		</p>
	{/if}

	<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
		<div class="flex flex-col gap-3 pb-2">
		{#if viewStep === 1}
			<section class="flex flex-col gap-4">
				<div>
					<h2 class="text-xl font-bold text-[var(--color-text)]">{d.onboarding.profileTitle}</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.onboarding.profileSubtitle}</p>
					{#if onboardingState.organizationName}
						<p class="mt-2 text-xs text-[var(--color-muted)]">
							{d.onboarding.orgLabel}:
							<span class="font-medium text-[var(--color-text)]">{onboardingState.organizationName}</span>
						</p>
					{/if}
				</div>

				<form
					id="onboarding-profile"
					method="POST"
					action="?/saveProfile"
					class="flex flex-col gap-4"
					novalidate
					use:enhance={pendingEnhance((v) => (profilePending = v), {
						onSuccess: advanceViewStepAfterSave
					})}
				>
					<input type="hidden" name="locale" value={locale} />
					<FormField label={d.onboarding.fullName} htmlFor="fullName" error={form?.fieldErrors?.fullName}>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="fullName"
								required
								name="fullName"
								value={onboardingState.fullName ?? ''}
								placeholder={d.onboarding.fullNamePlaceholder}
								autocomplete="name"
								maxlength={LIMITS.personName}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>

					<fieldset class="flex flex-col gap-2">
						<legend class="mb-1 text-sm font-medium text-[var(--color-text)]">
							{d.onboarding.roleLegend}
						</legend>
						<div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
							<label
								class="group relative cursor-pointer rounded-lg px-3 py-3 transition-colors hover:bg-[var(--color-surface-hover)] has-[:checked]:bg-[var(--color-primary-soft)]"
							>
								<input
									type="radio"
									name="roleIntent"
									value="owner"
									checked={!onboardingState.pendingAsProvisional}
									class="sr-only"
								/>
								<span class="flex flex-col gap-0.5">
									<span
										class="text-sm font-semibold text-[var(--color-text)] group-has-[:checked]:text-[var(--color-primary)]"
									>
										{d.onboarding.roleOwner}
									</span>
									<span class="text-xs leading-snug text-[var(--color-muted)]">
										{d.onboarding.roleOwnerHint}
									</span>
								</span>
							</label>
							<label
								class="group relative cursor-pointer rounded-lg px-3 py-3 transition-colors hover:bg-[var(--color-surface-hover)] has-[:checked]:bg-[var(--color-primary-soft)]"
							>
								<input
									type="radio"
									name="roleIntent"
									value="manager"
									checked={onboardingState.pendingAsProvisional}
									class="sr-only"
								/>
								<span class="flex flex-col gap-0.5">
									<span
										class="text-sm font-semibold text-[var(--color-text)] group-has-[:checked]:text-[var(--color-primary)]"
									>
										{d.onboarding.roleManager}
									</span>
									<span class="text-xs leading-snug text-[var(--color-muted)]">
										{d.onboarding.roleManagerHint}
									</span>
								</span>
							</label>
						</div>
					</fieldset>

					{#if form?.error}
						<p class="text-sm font-medium text-[var(--color-primary)]">{form.error}</p>
					{/if}
				</form>
			</section>
		{:else if viewStep === 2}
			<section class="flex flex-col gap-4">
				<div>
					<h2 class="text-xl font-bold text-[var(--color-text)]">{d.onboarding.gymTitle}</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.onboarding.gymSubtitle}</p>
				</div>

				<form
					id="onboarding-gym"
					method="POST"
					action="?/saveGym"
					class="flex flex-col gap-4"
					novalidate
					use:enhance={pendingEnhance((v) => (gymPending = v), {
						onSuccess: advanceViewStepAfterSave
					})}
				>
					<input type="hidden" name="locale" value={locale} />
					<FormField
						label={d.onboarding.gymName}
						htmlFor="gymName"
						hint={d.onboarding.gymNameHint}
						error={form?.fieldErrors?.gymName}
					>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="gymName"
								required
								name="gymName"
								value={onboardingState.gymName ?? onboardingState.organizationName ?? ''}
								placeholder={d.onboarding.gymNamePlaceholder}
								maxlength={LIMITS.entityName}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
					<FormField
						label={d.onboarding.gymAddress}
						htmlFor="gymAddress"
						hint={d.onboarding.gymAddressHint}
						error={form?.fieldErrors?.gymAddress}
					>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="gymAddress"
								name="gymAddress"
								placeholder={d.onboarding.gymAddressPlaceholder}
								autocomplete="street-address"
								maxlength={LIMITS.address}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
					<FormField
						label={d.onboarding.branchName}
						htmlFor="branchName"
						hint={d.onboarding.branchNameHint}
						error={form?.fieldErrors?.branchName}
					>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="branchName"
								name="branchName"
								placeholder={d.onboarding.branchNamePlaceholder}
								maxlength={LIMITS.entityName}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>

					{#if form?.error}
						<p class="text-sm font-medium text-[var(--color-primary)]">{form.error}</p>
					{/if}
				</form>
			</section>
		{:else if viewStep === 3}
			{@const atLimit = !canCreatePlan(planTier, plans.length)}
			<section class="flex flex-col gap-4">
				<div>
					<h2 class="text-xl font-bold text-[var(--color-text)]">{d.onboarding.plansTitle}</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.onboarding.plansSubtitle}</p>
				</div>

				<div class="flex flex-col gap-3">
					{#if dayPassPrice == null || dayPassOpen}
						<div class="text-center">
							<button
								type="button"
								class="inline-flex min-h-11 items-center px-2 text-sm text-[var(--color-primary)] underline transition-colors hover:opacity-80 disabled:opacity-70"
								onclick={() => {
									if (dayPassOpen) dayPassOpen = false;
									else void openDayPassEditor();
								}}
								disabled={anyPending}
								aria-expanded={dayPassOpen}
							>
								{dayPassToggleLabel}
							</button>
						</div>
					{/if}

					{#if dayPassOpen}
						<form
							id="onboarding-day-pass-form"
							method="POST"
							action="?/dayPass"
							class="flex flex-col gap-3 rounded-lg border border-dashed border-[var(--color-border)] px-3 py-3"
							novalidate
							use:enhance={pendingEnhance((v) => (dayPassPending = v), {
								onSuccess: () => (dayPassOpen = false)
							})}
						>
							<input type="hidden" name="locale" value={locale} />
							<div>
								<p class="text-sm font-semibold text-[var(--color-text)]">{d.plans.dayPassTitle}</p>
								<p class="mt-0.5 text-xs text-[var(--color-muted)]">{d.onboarding.dayPassHint}</p>
							</div>
							<FormField
								label={d.plans.dayPassPrice}
								htmlFor="onboarding-day-pass"
								error={form?.fieldErrors?.day_pass_price}
							>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="onboarding-day-pass"
										required
										name="day_pass_price"
										type="text"
										inputmode="decimal"
										placeholder="80"
										maxlength={LIMITS.amountInputMaxLen}
										bind:value={dayPassDraft}
										{invalid}
										{describedBy}
										oninput={(e) => {
											dayPassDraft = sanitizeDecimalInput(
												(e.currentTarget as HTMLInputElement).value
											);
										}}
										onblur={() => {
											dayPassDraft = String(
												parseClampedAmount(dayPassDraft, LIMITS.amount, 0)
											);
										}}
									/>
								{/snippet}
							</FormField>
							{#if form?.error}
								<p class="text-sm font-medium text-[var(--color-primary)]">{form.error}</p>
							{/if}
							<Button
								type="submit"
								variant="toolbarSecondary"
								class="w-full"
								disabled={anyPending}
							>
								{dayPassPending ? d.onboarding.saving : d.plans.dayPassSave}
							</Button>
						</form>
					{/if}
				</div>

				{#if plans.length > 0 || dayPassPrice != null}
					<ul class="space-y-2 text-sm">
						{#if dayPassPrice != null}
							<li class="rounded-lg border border-[var(--color-border)] px-3 py-2">
								<div class="flex items-center justify-between gap-2">
									<div class="min-w-0">
										<p class="truncate font-medium text-[var(--color-text)]">{d.plans.dayPassTitle}</p>
										<p class="text-[var(--color-muted)]">{formatDayPassAmount(dayPassPrice)} · 1d</p>
									</div>
									<button
										type="button"
										onclick={() => void openDayPassEditor()}
										class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
										aria-label={d.plans.edit}
										title={d.plans.edit}
										disabled={anyPending}
									>
										<Pencil class="h-3.5 w-3.5" aria-hidden="true" />
									</button>
								</div>
							</li>
						{/if}
						{#each plans as p (p.id)}
							<li class="rounded-lg border border-[var(--color-border)] px-3 py-2">
								{#if editingId === p.id}
									<form
										method="POST"
										action="?/updatePlan"
										class="flex flex-col gap-3"
										novalidate
										use:enhance={pendingEnhance(
											(v) => (editPlanPending = v),
											{ onSuccess: () => (editingId = null) }
										)}
									>
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="plan_id" value={p.id} />
										<FormField label={d.plans.planName} htmlFor="edit-name-{p.id}" error={form?.fieldErrors?.name}>
											{#snippet children({ invalid, describedBy })}
												<Input
													id="edit-name-{p.id}"
													required
													name="name"
													value={p.name}
													maxlength={LIMITS.entityName}
													{invalid}
													{describedBy}
												/>
											{/snippet}
										</FormField>
										<div class="grid grid-cols-2 gap-3">
											<FormField label={d.plans.price} htmlFor="edit-price-{p.id}" error={form?.fieldErrors?.price}>
												{#snippet children({ invalid, describedBy })}
													<Input
														id="edit-price-{p.id}"
														required
														name="price"
														type="text"
														inputmode="decimal"
														maxlength={LIMITS.amountInputMaxLen}
														bind:value={editPlanPrice}
														{invalid}
														{describedBy}
														oninput={(e) => {
															editPlanPrice = sanitizeDecimalInput(
																(e.currentTarget as HTMLInputElement).value
															);
														}}
														onblur={() => {
															editPlanPrice = String(
																parseClampedAmount(editPlanPrice, LIMITS.amount, 0)
															);
														}}
													/>
												{/snippet}
											</FormField>
											<FormField
												label={d.plans.durationDays}
												htmlFor="edit-days-{p.id}"
												error={form?.fieldErrors?.duration_days}
											>
												{#snippet children({ invalid, describedBy })}
													<DigitInput
														id="edit-days-{p.id}"
														name="duration_days"
														required
														min={1}
														max={LIMITS.planDurationDays}
														fallback={30}
														value={editPlanDuration}
														{invalid}
														{describedBy}
														onChange={(next) => (editPlanDuration = next)}
													/>
												{/snippet}
											</FormField>
										</div>
										{#if form?.error}
											<p class="text-sm font-medium text-[var(--color-primary)]">{form.error}</p>
										{/if}
										<div class="flex gap-2">
											<Button type="submit" class="flex-1" disabled={anyPending}>
												{editPlanPending ? d.onboarding.saving : d.plans.save}
											</Button>
											<Button
												type="button"
												variant="ghost"
												class="flex-1"
												onclick={() => (editingId = null)}
												disabled={anyPending}
											>
												{d.plans.cancel}
											</Button>
										</div>
									</form>
								{:else}
									<div class="flex items-center justify-between gap-2">
										<div class="min-w-0">
											<p class="truncate font-medium text-[var(--color-text)]">{p.name}</p>
											<p class="text-[var(--color-muted)]">${p.price} · {p.duration_days}d</p>
										</div>
										<div class="flex shrink-0 items-center gap-1">
											<button
												type="button"
												onclick={() => (editingId = p.id)}
												class="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
												aria-label={d.plans.edit}
												title={d.plans.edit}
											>
												<Pencil class="h-3.5 w-3.5" aria-hidden="true" />
											</button>
											<button
												type="button"
												onclick={() => (deleting = p)}
												class="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]"
												aria-label={d.plans.delete}
												title={d.plans.delete}
											>
												<Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
											</button>
										</div>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}

				<ConfirmDialog
					open={deleting != null}
					title={d.plans.delete}
					description={deleting ? `${d.plans.delete}: ${deleting.name}` : undefined}
					cancelLabel={d.plans.cancel}
					confirmLabel={d.plans.delete}
					action="?/deletePlan"
					onclose={() => (deleting = null)}
				>
					{#if deleting}
						<input type="hidden" name="locale" value={locale} />
						<input type="hidden" name="plan_id" value={deleting.id} />
					{/if}
				</ConfirmDialog>

				{#if !atLimit}
					<form
						method="POST"
						action="?/addPlan"
						class="flex flex-col gap-3"
						novalidate
						use:enhance={pendingEnhance((v) => (addPlanPending = v), {
							onSuccess: () => {
								addPlanPrice = '';
								addPlanDuration = 30;
							}
						})}
					>
						<input type="hidden" name="locale" value={locale} />
						<FormField
							label={d.plans.planName}
							htmlFor="plan-name"
							error={form?.fieldErrors?.name}
						>
							{#snippet children({ invalid, describedBy })}
								<Input
									id="plan-name"
									required
									name="name"
									placeholder={d.onboarding.planNamePlaceholder}
									maxlength={LIMITS.entityName}
									{invalid}
									{describedBy}
								/>
							{/snippet}
						</FormField>
						<div class="grid grid-cols-2 gap-3">
							<FormField
								label={d.plans.price}
								htmlFor="plan-price"
								error={form?.fieldErrors?.price}
							>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="plan-price"
										required
										name="price"
										type="text"
										inputmode="decimal"
										placeholder="500"
										maxlength={LIMITS.amountInputMaxLen}
										bind:value={addPlanPrice}
										{invalid}
										{describedBy}
										oninput={(e) => {
											addPlanPrice = sanitizeDecimalInput(
												(e.currentTarget as HTMLInputElement).value
											);
										}}
										onblur={() => {
											if (addPlanPrice) {
												addPlanPrice = String(
													parseClampedAmount(addPlanPrice, LIMITS.amount, 0)
												);
											}
										}}
									/>
								{/snippet}
							</FormField>
							<FormField
								label={d.plans.durationDays}
								htmlFor="plan-days"
								error={form?.fieldErrors?.duration_days}
							>
								{#snippet children({ invalid, describedBy })}
									<DigitInput
										id="plan-days"
										name="duration_days"
										required
										min={1}
										max={LIMITS.planDurationDays}
										fallback={30}
										value={addPlanDuration}
										{invalid}
										{describedBy}
										onChange={(next) => (addPlanDuration = next)}
									/>
								{/snippet}
							</FormField>
						</div>
						{#if form?.error}
							<p class="text-sm font-medium text-[var(--color-primary)]">{form.error}</p>
						{/if}
						<Button
							type="submit"
							variant="toolbarSecondary"
							class="mt-2 w-full"
							disabled={anyPending}
						>
							{addPlanPending ? d.onboarding.saving : d.onboarding.addPlan}
						</Button>
					</form>
				{:else}
					<p class="text-sm text-[var(--color-muted)]">{d.onboarding.planLimit}</p>
					{#if planTier === 'FREEMIUM'}
						<div class="flex flex-col gap-2">
							<Button
								type="button"
								variant="toolbarSecondary"
								class="w-full"
								onclick={() => (upgradeTier = 'STARTER')}
							>
								{d.onboarding.planLimitUpgrade}
							</Button>
							<Button
								type="button"
								variant="ghost"
								class="w-full py-2 text-sm"
								onclick={() => (compareOpen = true)}
							>
								{d.onboarding.comparePlans}
							</Button>
						</div>
					{/if}
				{/if}

				<form
					id="onboarding-skip-plans"
					method="POST"
					action="?/skipPlans"
					use:enhance={pendingEnhance((v) => (skipPlansPending = v), {
						onSuccess: advanceViewStepAfterSave
					})}
				>
					<input type="hidden" name="locale" value={locale} />
				</form>
			</section>
		{:else if viewStep === 4}
			<section class="flex flex-col gap-4">
				<div>
					<h2 class="text-xl font-bold text-[var(--color-text)]">{d.onboarding.billingTitle}</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.onboarding.billingSubtitle}</p>
				</div>

				{#if billingFlash}
					<p
						class="rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-3 py-2 text-sm font-medium text-[var(--color-success)]"
						role="status"
					>
						{d.onboarding.billingFlashSuccess}
					</p>
				{/if}
				{#if billingMessage}
					<p
						class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--color-primary)]"
						role="status"
					>
						{billingMessage}
					</p>
				{/if}

				<ul class="flex flex-col gap-2">
					{#each AMRAP_PLANS as plan (plan.tier)}
						{@const isCurrent = plan.tier === planTier}
						<li
							class="flex flex-row items-center justify-between gap-3 rounded-xl border px-4 py-3 {isCurrent
								? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5'
								: 'border-[var(--color-border)] bg-[var(--color-surface)]'}"
						>
							<div class="min-w-0 flex-1">
								<div class="flex min-w-0 flex-wrap items-center gap-2">
									<p class="font-semibold text-[var(--color-text)]">{planDisplayName(plan.tier)}</p>
									{#if isCurrent}
										<span
											class="rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-success)]"
										>
											{d.onboarding.billingCurrent}
										</span>
									{/if}
								</div>
								<p class="text-sm tabular-nums text-[var(--color-muted)]">{priceLine(plan.tier)}</p>
							</div>
							{#if plan.tier === 'PRO'}
								<a
									href="/{locale}#contact"
									class="inline-flex h-11 min-h-[var(--touch-target)] shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
								>
									{d.onboarding.billingContactPro}
								</a>
							{:else if !isCurrent && plan.tier !== 'FREEMIUM'}
								<Button
									type="button"
									variant="toolbarSecondary"
									class="shrink-0"
									onclick={() => (upgradeTier = plan.tier)}
								>
									{d.onboarding.billingChoose}
								</Button>
							{/if}
						</li>
					{/each}
				</ul>

				<Button type="button" variant="ghost" class="w-full py-2 text-sm" onclick={() => (compareOpen = true)}>
					{d.onboarding.comparePlans}
				</Button>

				<form
					id="onboarding-skip-billing"
					method="POST"
					action="?/skipBilling"
					use:enhance={pendingEnhance((v) => (skipBillingPending = v), {
						onSuccess: advanceViewStepAfterSave
					})}
				>
					<input type="hidden" name="locale" value={locale} />
				</form>
			</section>
		{:else if viewStep === 5}
			<section class="flex flex-col gap-4 text-center">
				<div>
					<h2 class="text-xl font-bold text-[var(--color-text)]">{d.onboarding.doneTitle}</h2>
					<p class="mt-2 text-sm text-[var(--color-muted)]">{d.onboarding.doneSubtitle}</p>
				</div>
				<dl class="space-y-2 rounded-lg border border-[var(--color-border)] p-4 text-left text-sm">
					<div class="flex justify-between gap-4">
						<dt class="text-[var(--color-muted)]">{d.onboarding.orgLabel}</dt>
						<dd class="font-medium text-[var(--color-text)]">{onboardingState.organizationName}</dd>
					</div>
					<div class="flex justify-between gap-4">
						<dt class="text-[var(--color-muted)]">{d.onboarding.gymLabel}</dt>
						<dd class="font-medium text-[var(--color-text)]">{onboardingState.gymName}</dd>
					</div>
				</dl>
				<form
					id="onboarding-finish"
					method="POST"
					action="?/finish"
					use:enhance={pendingEnhance((v) => (finishPending = v), { leavePage: true })}
				>
					<input type="hidden" name="locale" value={locale} />
				</form>
			</section>
		{/if}
		</div>
	</div>

	<div
		class="sticky bottom-0 z-10 mt-4 shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 pt-3 pb-[max(0.75rem,var(--safe-bottom))] backdrop-blur-sm"
	>
		<div class="flex flex-col gap-2">
			<div class="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:gap-3">
				<Button
					type="submit"
					form={primaryFormId}
					variant="primaryBlock"
					class="sm:flex-1"
					disabled={anyPending}
				>
					{primaryLabel}
				</Button>
				{#if viewStep > 1}
					<Button
						type="button"
						variant="ghost"
						class="w-full py-2.5 text-sm sm:w-auto sm:min-w-[7rem]"
						onclick={goBack}
						disabled={anyPending}
					>
						{d.common.back}
					</Button>
				{/if}
			</div>
			<div class="pt-1 text-center">
				<LogoutButton
					locale={locale}
					pendingLabel={d.nav.loggingOut}
					class="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
				>
					{d.nav.logout}
				</LogoutButton>
			</div>
		</div>
	</div>
</div>

<PlanCompareDialog open={compareOpen} onOpenChange={(o) => (compareOpen = o)} labels={compareLabels} />

<UpgradeConfirmDialog
	{locale}
	open={upgradeTier != null}
	tier={upgradeTier}
	currentTier={planTier}
	planName={upgradeTier ? planDisplayName(upgradeTier) : ''}
	labels={upgradeLabels}
	action="?/checkout"
	returnTo="onboarding"
	onOpenChange={(open) => {
		if (!open) upgradeTier = null;
	}}
	onResult={onCheckoutResult}
/>

<EmbeddedCheckoutDialog
	clientSecret={checkoutClientSecret}
	publishableKey={stripePublishableKey}
	title={d.organization.checkoutTitle}
	description={d.organization.checkoutDescription}
	mountLabel={d.organization.checkoutMountLabel}
	loadError={d.organization.checkoutFailed}
	closeLabel={d.organization.close}
	onClose={() => (checkoutClientSecret = null)}
/>
