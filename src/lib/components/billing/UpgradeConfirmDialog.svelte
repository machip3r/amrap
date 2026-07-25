<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import type { Locale } from '$lib/i18n/config';
	import { formatMoney } from '$lib/i18n/money';
	import { AMRAP_PLANS, isPlanDowngrade } from '$lib/plans/limits';
	import type { OrgActionState } from '$lib/server/organization/billing';
	import type { OrgPlanTier } from '$lib/types';

	export type UpgradeConfirmLabels = {
		upgradeConfirmTitle: string;
		upgradeConfirmDescription: string;
		changeConfirmTitle: string;
		changeConfirmDescription: string;
		upgradeConfirmSubmit: string;
		changeConfirmSubmit: string;
		billingIntervalLabel: string;
		billingMonthly: string;
		billingMonthlyHint: string;
		billingAnnual: string;
		billingAnnualHint: string;
		billingAnnualSaveBadge: string;
		perMonth: string;
		perYear: string;
		cancel: string;
		close: string;
		save: string;
	};

	type Props = {
		locale: Locale;
		open: boolean;
		tier: OrgPlanTier | null;
		currentTier: OrgPlanTier;
		planName?: string;
		labels: UpgradeConfirmLabels;
		/** Form action (e.g. `?/checkout`). */
		action?: string;
		/** Embedded Checkout return surface. */
		returnTo?: 'organization' | 'onboarding';
		onOpenChange: (open: boolean) => void;
		onResult?: (data: OrgActionState) => void;
	};

	let {
		locale,
		open,
		tier,
		currentTier,
		planName = '',
		labels,
		action = '?/checkout',
		returnTo = 'organization',
		onOpenChange,
		onResult
	}: Props = $props();

	let billingInterval = $state<'month' | 'year'>('month');
	let pending = $state(false);

	const displayName = $derived(planName || tier || '');

	const isDowngrade = $derived(tier != null && isPlanDowngrade(currentTier, tier));

	$effect(() => {
		if (open) billingInterval = 'month';
	});
</script>

<Dialog
	{open}
	onOpenChange={(next) => {
		if (!next) onOpenChange(false);
	}}
	title={isDowngrade ? labels.changeConfirmTitle : labels.upgradeConfirmTitle}
	description={(isDowngrade ? labels.changeConfirmDescription : labels.upgradeConfirmDescription).replace(
		'{plan}',
		displayName
	)}
	closeLabel={labels.close}
	class="max-w-lg"
>
	{#if tier}
		{@const upgradePlan = AMRAP_PLANS.find((p) => p.tier === tier)}
		{@const monthlyAmount =
			locale === 'en'
				? (upgradePlan?.priceUsdMonthly ?? null)
				: (upgradePlan?.priceMxnMonthly ?? null)}
		{@const annualAmount = monthlyAmount != null ? monthlyAmount * 10 : null}
		<form
			method="POST"
			{action}
			class="flex flex-col gap-5"
			use:enhance={() => {
				pending = true;
				return async ({ result, update }) => {
					pending = false;
					if (result.type === 'success' && result.data) {
						const data = result.data as OrgActionState;
						onResult?.(data);
						if (data?.clientSecret || data?.portalUrl) {
							onOpenChange(false);
							return;
						}
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="tier" value={tier} />
			<input type="hidden" name="interval" value={billingInterval} />
			<input type="hidden" name="return_to" value={returnTo} />
			<fieldset class="flex flex-col gap-3">
				<legend class="mb-2 text-sm font-semibold text-[var(--color-text)]">
					{labels.billingIntervalLabel}
				</legend>
				<div
					class="grid grid-cols-1 gap-2 sm:grid-cols-2"
					role="radiogroup"
					aria-label={labels.billingIntervalLabel}
				>
					<label
						class="group relative flex min-h-[var(--touch-target)] cursor-pointer flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition-colors hover:border-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-primary-soft)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-ring)]"
					>
						<input
							type="radio"
							name="interval_ui"
							value="month"
							class="sr-only"
							checked={billingInterval === 'month'}
							onchange={() => (billingInterval = 'month')}
						/>
						<span class="flex items-start justify-between gap-2">
							<span class="flex min-w-0 items-center gap-2.5">
								<span
									class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] group-has-[:checked]:border-[var(--color-primary)]"
									aria-hidden="true"
								>
									<span
										class="h-2.5 w-2.5 rounded-full bg-transparent group-has-[:checked]:bg-[var(--color-primary)]"
									></span>
								</span>
								<span class="min-w-0">
									<span
										class="block text-sm font-semibold text-[var(--color-text)] group-has-[:checked]:text-[var(--color-primary)]"
									>
										{labels.billingMonthly}
									</span>
									<span class="mt-0.5 block text-xs leading-snug text-[var(--color-muted)]">
										{labels.billingMonthlyHint}
									</span>
								</span>
							</span>
						</span>
						{#if monthlyAmount != null}
							<span class="pl-[1.875rem] text-sm font-semibold tabular-nums text-[var(--color-text)]">
								{formatMoney(monthlyAmount, locale)}
								<span class="font-normal text-[var(--color-muted)]">{labels.perMonth}</span>
							</span>
						{/if}
					</label>
					<label
						class="group relative flex min-h-[var(--touch-target)] cursor-pointer flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition-colors hover:border-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-primary-soft)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-ring)]"
					>
						<input
							type="radio"
							name="interval_ui"
							value="year"
							class="sr-only"
							checked={billingInterval === 'year'}
							onchange={() => (billingInterval = 'year')}
						/>
						<span class="flex items-start justify-between gap-2">
							<span class="flex min-w-0 items-center gap-2.5">
								<span
									class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] group-has-[:checked]:border-[var(--color-primary)]"
									aria-hidden="true"
								>
									<span
										class="h-2.5 w-2.5 rounded-full bg-transparent group-has-[:checked]:bg-[var(--color-primary)]"
									></span>
								</span>
								<span class="min-w-0">
									<span
										class="block text-sm font-semibold text-[var(--color-text)] group-has-[:checked]:text-[var(--color-primary)]"
									>
										{labels.billingAnnual}
									</span>
									<span class="mt-0.5 block text-xs leading-snug text-[var(--color-muted)]">
										{labels.billingAnnualHint}
									</span>
								</span>
							</span>
							<span
								class="shrink-0 rounded-md bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]"
							>
								{labels.billingAnnualSaveBadge}
							</span>
						</span>
						{#if annualAmount != null}
							<span class="pl-[1.875rem] text-sm font-semibold tabular-nums text-[var(--color-text)]">
								{formatMoney(annualAmount, locale)}
								<span class="font-normal text-[var(--color-muted)]">{labels.perYear}</span>
							</span>
						{/if}
					</label>
				</div>
			</fieldset>
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="ghost"
					class="rounded-lg px-4 py-2.5 text-sm font-semibold"
					onclick={() => onOpenChange(false)}
				>
					{labels.cancel}
				</Button>
				<Button type="submit" class="mt-0" disabled={pending}>
					{pending
						? labels.save
						: isDowngrade
							? labels.changeConfirmSubmit
							: labels.upgradeConfirmSubmit}
				</Button>
			</div>
		</form>
	{/if}
</Dialog>
