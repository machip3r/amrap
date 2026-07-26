<script lang="ts">
	import { enhance } from '$app/forms';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Plus from '@lucide/svelte/icons/plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import EmbeddedCheckoutMount from '$lib/components/organization/EmbeddedCheckoutMount.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import { formatMoney } from '$lib/i18n/money';
	import {
		AMRAP_PLANS,
		ORG_DELETION_RETENTION_DAYS,
		canCreateGym,
		isPlanDowngrade,
		maxGyms
	} from '$lib/plans/limits';
	import type { OrgActionState } from '$lib/server/organization/actions';
	import type { OrgPlanTier } from '$lib/types';
	import { LIMITS } from '$lib/validation/schemas';

	export type OrgGymRow = {
		id: string;
		name: string;
		deleted_at: string | null;
		isCurrent: boolean;
	};

	export type OrgFeedbackRow = {
		id: string;
		body: string;
		createdAt: string;
		authorName: string | null;
	};

	type Props = {
		locale: Locale;
		d: Dictionary;
		organizationName: string;
		planTier: OrgPlanTier;
		hasStripeCustomer: boolean;
		billingFlash: 'success' | 'cancel' | null;
		stripePublishableKey: string | null;
		gyms: OrgGymRow[];
		feedback?: OrgFeedbackRow[];
		activeGymName?: string;
	};

	let {
		locale,
		d,
		organizationName,
		planTier,
		hasStripeCustomer,
		billingFlash,
		stripePublishableKey,
		gyms,
		feedback = [],
		activeGymName = ''
	}: Props = $props();

	const labels = $derived(d.organization);
	const contactHref = $derived(`/${locale}#contact`);

	/** Soft-delete gym / org UI — re-enable when product is ready. */
	const showDeletionUi = false;

	let createOpen = $state(false);
	let deleteGym = $state<OrgGymRow | null>(null);
	let deleteOrgOpen = $state(false);
	let orgConfirmName = $state('');
	let gymConfirmName = $state('');
	let upgradeTier = $state<OrgPlanTier | null>(null);
	let billingInterval = $state<'month' | 'year'>('month');
	let checkoutClientSecret = $state<string | null>(null);

	let flash = $state<string | undefined>(undefined);
	let flashError = $state<string | undefined>(undefined);
	let checkoutPending = $state(false);
	let portalPending = $state(false);
	let createPending = $state(false);
	let gymDeletePending = $state(false);
	let gymCancelPending = $state(false);
	let orgDeletePending = $state(false);

	$effect(() => {
		if (billingFlash === 'success') {
			flash = labels.billingSuccessFlash;
			flashError = undefined;
		} else if (billingFlash === 'cancel') {
			flashError = labels.billingCancelFlash;
			flash = undefined;
		}
	});

	function openUpgradeConfirm(tier: OrgPlanTier) {
		upgradeTier = tier;
		billingInterval = 'month';
	}

	const activeGymCount = $derived(gyms.filter((g) => !g.deleted_at).length);
	const gymCap = $derived(maxGyms(planTier));
	const canAddGym = $derived(canCreateGym(planTier, activeGymCount));
	const needsUpgradeForGym = $derived(!canAddGym);

	const upgradePlanLabel = $derived(
		upgradeTier != null ? planLabel(upgradeTier) : ''
	);
	const isDowngradeConfirm = $derived(
		upgradeTier != null && isPlanDowngrade(planTier, upgradeTier)
	);

	function planLabel(tier: OrgPlanTier) {
		switch (tier) {
			case 'STARTER':
				return labels.planStarter;
			case 'GROWTH':
				return labels.planGrowth;
			case 'PRO':
				return labels.planPro;
			default:
				return labels.planFreemium;
		}
	}

	function priceLine(tier: OrgPlanTier): { amount: string; note: string } {
		const plan = AMRAP_PLANS.find((p) => p.tier === tier)!;
		if (plan.priceNote === 'free') {
			return { amount: formatMoney(0, locale), note: labels.perMonth };
		}
		if (plan.priceNote === 'contact') {
			return { amount: labels.priceContact, note: labels.contactSales };
		}
		const amountMxn = plan.priceMxnMonthly ?? 0;
		const amountUsd = plan.priceUsdMonthly ?? 0;
		const amount = formatMoney(locale === 'en' ? amountUsd : amountMxn, locale);
		const note =
			plan.priceNote === 'per_org'
				? `${labels.perMonth} · ${labels.pricePerOrg}`
				: `${labels.perMonth} · ${labels.pricePerGym}`;
		return { amount, note };
	}

	function retentionDate(iso: string) {
		const base = new Date(iso);
		base.setDate(base.getDate() + ORG_DELETION_RETENTION_DAYS);
		try {
			return base.toLocaleDateString(locale, {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			});
		} catch {
			return base.toISOString().slice(0, 10);
		}
	}

	function applyState(data: OrgActionState) {
		if (!data) return;
		if (data.error) {
			flashError = data.error;
			flash = undefined;
			return;
		}
		if (data.clientSecret) {
			checkoutClientSecret = data.clientSecret;
			upgradeTier = null;
			flash = undefined;
			flashError = undefined;
			return;
		}
		if (data.portalUrl) {
			window.open(data.portalUrl, '_blank', 'noopener,noreferrer');
			flash = undefined;
			flashError = undefined;
			return;
		}
		if (data.message) {
			flash = data.message;
			flashError = undefined;
		}
	}

	function closeEmbeddedCheckout() {
		checkoutClientSecret = null;
	}
</script>

<div class="flex flex-col gap-5">
	<header>
		<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
			{labels.title}
		</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.subtitle}</p>
		<p
			class="mt-3 flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--color-text)] shadow-sm"
		>
			<Building2 class="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
			<span class="min-w-0 flex-1 truncate">{organizationName}</span>
			<span
				class="shrink-0 rounded-md bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]"
			>
				{planLabel(planTier)}
			</span>
		</p>
	</header>

	{#if flashError || flash}
		<p
			class="rounded-lg border px-4 py-3 text-sm font-medium {flashError
				? 'border-[var(--color-danger)]/25 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
				: 'border-[var(--color-success)]/25 bg-[var(--color-success)]/10 text-[var(--color-success)]'}"
			role="status"
		>
			{flashError ?? flash}
		</p>
	{/if}

	<section
		id="gyms"
		class="scroll-mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	>
		<div class="mb-5 flex flex-row items-start justify-between gap-3">
			<div class="min-w-0 flex-1">
				<h2 class="font-title text-xl font-bold text-[var(--color-text)]">{labels.gymsTitle}</h2>
				<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.gymsHint}</p>
				{#if gymCap != null}
					<p class="mt-2 text-xs font-medium text-[var(--color-muted)]">
						{labels.gymQuota
							.replace('{used}', String(activeGymCount))
							.replace('{max}', String(gymCap))}
					</p>
				{/if}
				{#if needsUpgradeForGym}
					<p class="mt-2 text-sm text-[var(--color-muted)]">{labels.gymCapContact}</p>
				{/if}
			</div>
			{#if !needsUpgradeForGym}
				<Button
					type="button"
					variant="toolbar"
					class="mt-0 !h-9 !min-h-9 shrink-0 gap-1 !px-2.5 !text-xs"
					onclick={() => (createOpen = true)}
				>
					<Plus class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
					<span class="shrink-0">{labels.addGym}</span>
				</Button>
			{/if}
		</div>

		<ul class="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
			{#each gyms as gym (gym.id)}
				<li class="flex flex-row items-center gap-3 px-4 py-3">
					<div class="min-w-0 flex-1">
						<p class="flex min-w-0 flex-wrap items-center gap-2">
							<span class="truncate font-semibold text-[var(--color-text)]">{gym.name}</span>
							{#if gym.isCurrent}
								<span
									class="shrink-0 rounded-md bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]"
								>
									{labels.currentGym}
								</span>
							{/if}
						</p>
						{#if gym.deleted_at}
							<p class="mt-1 text-xs">
								<span
									class="rounded-md bg-[var(--color-danger)]/10 px-2 py-0.5 font-medium text-[var(--color-danger)]"
								>
									{labels.scheduledDeletion.replace('{date}', retentionDate(gym.deleted_at))}
								</span>
							</p>
						{/if}
					</div>
					{#if showDeletionUi || gym.deleted_at}
						<div class="ml-auto flex shrink-0 items-center">
							{#if gym.deleted_at}
								<form
									method="POST"
									action="?/cancelGymDelete"
									use:enhance={() => {
										gymCancelPending = true;
										return async ({ result, update }) => {
											gymCancelPending = false;
											await update();
											if (result.type === 'success') applyState(result.data as OrgActionState);
										};
									}}
								>
									<input type="hidden" name="locale" value={locale} />
									<input type="hidden" name="gym_id" value={gym.id} />
									<button
										type="submit"
										disabled={gymCancelPending}
										class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
										aria-label={labels.cancelDeletion}
										title={labels.cancelDeletion}
									>
										<RotateCcw class="h-4 w-4" aria-hidden="true" />
									</button>
								</form>
							{:else if showDeletionUi}
								<button
									type="button"
									class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
									aria-label={labels.deleteGym}
									title={labels.deleteGym}
									onclick={() => {
										deleteGym = gym;
										gymConfirmName = '';
									}}
								>
									<Trash2 class="h-4 w-4" aria-hidden="true" />
								</button>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section
		id="feedback"
		class="scroll-mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	>
		<div class="mb-4">
			<h2 class="font-title text-xl font-bold text-[var(--color-text)]">{labels.feedbackTitle}</h2>
			<p class="mt-1 text-sm text-[var(--color-muted)]">
				{labels.feedbackHint}
				{#if activeGymName}
					<span class="font-medium text-[var(--color-text)]"> · {activeGymName}</span>
				{/if}
			</p>
		</div>
		{#if feedback.length === 0}
			<p class="text-sm text-[var(--color-muted)]">{labels.feedbackEmpty}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each feedback as item (item.id)}
					<li
						class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3"
					>
						<p class="whitespace-pre-wrap text-sm text-[var(--color-text)]">{item.body}</p>
						<p class="mt-2 text-xs text-[var(--color-muted)]">
							{item.authorName ?? labels.feedbackAuthor}
							·
							{new Date(item.createdAt).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', {
								day: '2-digit',
								month: 'short',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<div class="flex items-center gap-3 px-1" role="separator" aria-label={labels.subscriptionTitle}>
		<div class="h-px flex-1 bg-[var(--color-border)]"></div>
		<span
			class="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]"
		>
			{labels.subscriptionTitle}
		</span>
		<div class="h-px flex-1 bg-[var(--color-border)]"></div>
	</div>

	<section
		id="subscription"
		class="scroll-mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5"
	>
		<div class="mb-3 flex flex-row flex-wrap items-center justify-between gap-2 sm:gap-3">
			<p class="min-w-0 text-xs text-[var(--color-muted)]">
				{labels.currentPlan}:
				<span class="font-semibold text-[var(--color-text)]">{planLabel(planTier)}</span>
			</p>
			{#if hasStripeCustomer}
				<form
					method="POST"
					action="?/billingPortal"
					class="shrink-0"
					use:enhance={() => {
						portalPending = true;
						return async ({ result, update }) => {
							portalPending = false;
							if (result.type === 'success' && result.data) {
								const data = result.data as OrgActionState;
								applyState(data);
								if (data.portalUrl) {
									return;
								}
							}
							await update();
						};
					}}
				>
					<input type="hidden" name="locale" value={locale} />
					<Button type="submit" variant="ghost" class="mt-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text)]" disabled={portalPending}>
						{portalPending ? labels.save : labels.manageBilling}
					</Button>
				</form>
			{/if}
		</div>

		<ul class="flex flex-col gap-2">
			{#each AMRAP_PLANS as plan (plan.tier)}
				{@const isCurrent = plan.tier === planTier}
				{@const pricing = priceLine(plan.tier)}
				{@const isContact = plan.priceNote === 'contact'}
				{@const canAct = plan.tier !== 'FREEMIUM' && !isCurrent}
				{@const rowClass = `group flex min-h-[var(--touch-target)] w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors sm:gap-4 sm:px-4 ${
					isCurrent
						? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5'
						: canAct
							? 'border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]'
							: 'border-[var(--color-border)]/80'
				}`}

				<li>
					{#if canAct && isContact}
						<a href={contactHref} class={rowClass}>
							<div class="min-w-0 flex-1">
								<div class="flex min-w-0 flex-wrap items-center gap-2">
									<span class="text-sm font-semibold text-[var(--color-text)]"
										>{planLabel(plan.tier)}</span
									>
								</div>
								<p class="mt-0.5 truncate text-xs text-[var(--color-muted)]">
									<span class="font-semibold tabular-nums text-[var(--color-text)]"
										>{pricing.amount}</span
									>
									<span class="text-[var(--color-muted)]"> · {pricing.note}</span>
								</p>
							</div>
							<span
								class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 text-xs font-bold text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-primary-on)]"
							>
								{labels.contactSales}
								<ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
							</span>
						</a>
					{:else if canAct}
						{@const downgrade = isPlanDowngrade(planTier, plan.tier)}
						<button
							type="button"
							class={rowClass}
							onclick={() => openUpgradeConfirm(plan.tier)}
						>
							<div class="min-w-0 flex-1">
								<div class="flex min-w-0 flex-wrap items-center gap-2">
									<span class="text-sm font-semibold text-[var(--color-text)]"
										>{planLabel(plan.tier)}</span
									>
								</div>
								<p class="mt-0.5 truncate text-xs text-[var(--color-muted)]">
									<span class="font-semibold tabular-nums text-[var(--color-text)]"
										>{pricing.amount}</span
									>
									<span class="text-[var(--color-muted)]"> · {pricing.note}</span>
								</p>
							</div>
							<span
								class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 text-xs font-bold text-[var(--color-primary-on)] shadow-sm transition-colors group-hover:bg-[var(--color-primary-hover)]"
							>
								{downgrade ? labels.changePlan : labels.upgrade}
							</span>
						</button>
					{:else}
						<div class={rowClass} aria-current={isCurrent ? 'true' : undefined}>
							<div class="min-w-0 flex-1">
								<div class="flex min-w-0 flex-wrap items-center gap-2">
									<span class="text-sm font-semibold text-[var(--color-text)]"
										>{planLabel(plan.tier)}</span
									>
									{#if isCurrent}
										<span
											class="rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-success)]"
										>
											{labels.current}
										</span>
									{/if}
								</div>
								<p class="mt-0.5 truncate text-xs text-[var(--color-muted)]">
									<span class="font-semibold tabular-nums text-[var(--color-text)]"
										>{pricing.amount}</span
									>
									<span class="text-[var(--color-muted)]"> · {pricing.note}</span>
								</p>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	{#if showDeletionUi}
		<section
			id="danger"
			class="scroll-mt-6 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		>
			<div class="flex flex-row items-center justify-between gap-3">
				<div class="flex min-w-0 flex-1 items-start gap-3">
					<div
						class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
					>
						<AlertTriangle class="h-5 w-5" aria-hidden="true" />
					</div>
					<div class="min-w-0">
						<h2 class="font-title text-xl font-bold text-[var(--color-text)]">{labels.dangerTitle}</h2>
						<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.dangerHint}</p>
						<p class="mt-2 text-xs text-[var(--color-muted)]">
							{labels.retentionNote.replace('{days}', String(ORG_DELETION_RETENTION_DAYS))}
						</p>
					</div>
				</div>
				<button
					type="button"
					class="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-1.5 self-center rounded-lg bg-[var(--color-danger)] text-white shadow-sm transition-colors hover:bg-[var(--color-danger)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] sm:w-auto sm:px-4"
					aria-label={labels.deleteOrg}
					onclick={() => {
						deleteOrgOpen = true;
						orgConfirmName = '';
					}}
				>
					<Trash2 class="h-4 w-4" aria-hidden="true" />
					<span class="hidden sm:inline">{labels.deleteOrg}</span>
				</button>
			</div>
		</section>
	{/if}

	<Dialog
		open={upgradeTier != null}
		onOpenChange={(open) => {
			if (!open) upgradeTier = null;
		}}
		title={isDowngradeConfirm ? labels.changeConfirmTitle : labels.upgradeConfirmTitle}
		description={(isDowngradeConfirm
			? labels.changeConfirmDescription
			: labels.upgradeConfirmDescription
		).replace('{plan}', upgradePlanLabel)}
		closeLabel={labels.close}
		class="max-w-lg"
	>
		{#if upgradeTier}
			{@const upgradePlan = AMRAP_PLANS.find((p) => p.tier === upgradeTier)}
			{@const monthlyAmount =
				locale === 'en'
					? (upgradePlan?.priceUsdMonthly ?? null)
					: (upgradePlan?.priceMxnMonthly ?? null)}
			{@const annualAmount = monthlyAmount != null ? monthlyAmount * 10 : null}
			<form
				method="POST"
				action="?/checkout"
				class="flex flex-col gap-5"
				use:enhance={() => {
					checkoutPending = true;
					return async ({ result, update }) => {
						checkoutPending = false;
						if (result.type === 'success' && result.data) {
							const data = result.data as OrgActionState;
							applyState(data);
							// Opening Checkout/Portal is client-only — invalidateAll remounts and
							// drops clientSecret / portalUrl before the UI can show them.
							if (data.clientSecret || data.portalUrl) {
								return;
							}
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="locale" value={locale} />
				<input type="hidden" name="tier" value={upgradeTier} />
				<input type="hidden" name="interval" value={billingInterval} />
				<fieldset class="flex flex-col gap-3">
					<legend class="text-sm font-semibold text-[var(--color-text)] mb-2">
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
						onclick={() => (upgradeTier = null)}
					>
						{labels.cancel}
					</Button>
					<Button type="submit" class="mt-0" disabled={checkoutPending}>
						{checkoutPending
							? labels.save
							: isDowngradeConfirm
								? labels.changeConfirmSubmit
								: labels.upgradeConfirmSubmit}
					</Button>
				</div>
			</form>
		{/if}
	</Dialog>

	<Dialog
		open={checkoutClientSecret != null}
		onOpenChange={(open) => {
			if (!open) closeEmbeddedCheckout();
		}}
		title={labels.checkoutTitle}
		description={labels.checkoutDescription}
		closeLabel={labels.close}
		fullScreen={true}
		bodyClass="px-3 py-3 sm:px-6 sm:py-4"
		autoFocus={false}
	>
		{#if checkoutClientSecret && stripePublishableKey}
			<EmbeddedCheckoutMount
				clientSecret={checkoutClientSecret}
				publishableKey={stripePublishableKey}
				mountLabel={labels.checkoutMountLabel}
				loadError={labels.checkoutFailed}
			/>
		{:else if checkoutClientSecret && !stripePublishableKey}
			<p class="text-sm text-[var(--color-danger)]" role="alert">{labels.checkoutFailed}</p>
		{/if}
	</Dialog>

	<Dialog
		open={createOpen}
		onOpenChange={(open) => (createOpen = open)}
		title={labels.addGymTitle}
		description={labels.addGymDescription}
		closeLabel={labels.close}
		class="max-w-lg"
	>
		<form
			method="POST"
			action="?/createGym"
			class="flex flex-col gap-4"
			novalidate
			use:enhance={() => {
				createPending = true;
				return async ({ result, update }) => {
					createPending = false;
					await update();
					if (result.type === 'success') {
						applyState(result.data as OrgActionState);
						const data = result.data as OrgActionState;
						if (data?.success) createOpen = false;
					}
				};
			}}
		>
			<input type="hidden" name="locale" value={locale} />
			<FormField label={labels.gymName} htmlFor="org-gym-name">
				{#snippet children({ invalid, describedBy })}
					<Input
						id="org-gym-name"
						name="name"
						required
						maxlength={LIMITS.entityName}
						autocomplete="organization"
						{invalid}
						{describedBy}
					/>
				{/snippet}
			</FormField>
			<p class="text-sm text-[var(--color-muted)]">{labels.createGymComingSoon}</p>
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="ghost"
					class="rounded-lg px-4 py-2.5 text-sm font-semibold"
					onclick={() => (createOpen = false)}
				>
					{labels.cancel}
				</Button>
				<Button type="submit" class="mt-0" disabled={createPending}>{labels.save}</Button>
			</div>
		</form>
	</Dialog>

	{#if showDeletionUi}
		<Dialog
			open={deleteGym != null}
			onOpenChange={(open) => {
				if (!open) {
					deleteGym = null;
					gymConfirmName = '';
				}
			}}
			title={labels.deleteGymTitle}
			description={labels.deleteGymHint}
			closeLabel={labels.close}
			class="max-w-md"
			containerClass="items-center justify-center p-[var(--spacing-page)] sm:p-6"
		>
			{#if deleteGym}
				{@const gymToDelete = deleteGym}
				<form
					method="POST"
					action="?/deleteGym"
					class="flex flex-col gap-4"
					novalidate
					use:enhance={() => {
						gymDeletePending = true;
						return async ({ result, update }) => {
							gymDeletePending = false;
							await update();
							if (result.type === 'success') {
								applyState(result.data as OrgActionState);
								const data = result.data as OrgActionState;
								if (data?.success) {
									deleteGym = null;
									gymConfirmName = '';
								}
							}
						};
					}}
				>
					<input type="hidden" name="locale" value={locale} />
					<input type="hidden" name="gym_id" value={gymToDelete.id} />
					<FormField label={labels.confirmName} htmlFor="org-gym-confirm">
						{#snippet children({ invalid, describedBy })}
							<Input
								id="org-gym-confirm"
								name="confirm_name"
								required
								maxlength={LIMITS.entityName}
								placeholder={labels.confirmNamePlaceholder.replace('{name}', gymToDelete.name)}
								autocomplete="off"
								bind:value={gymConfirmName}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
					<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="ghost"
							class="rounded-lg px-4 py-2.5 text-sm font-semibold"
							onclick={() => {
								deleteGym = null;
								gymConfirmName = '';
							}}
						>
							{labels.cancel}
						</Button>
						<Button
							type="submit"
							class="mt-0 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]"
							disabled={gymDeletePending ||
								gymConfirmName.trim().toLowerCase() !== gymToDelete.name.trim().toLowerCase()}
						>
							{labels.confirmDelete}
						</Button>
					</div>
				</form>
			{/if}
		</Dialog>

		<Dialog
			open={deleteOrgOpen}
			onOpenChange={(open) => {
				deleteOrgOpen = open;
				if (!open) orgConfirmName = '';
			}}
			title={labels.deleteOrgTitle}
			description={labels.deleteOrgHint}
			closeLabel={labels.close}
			class="max-w-md"
			containerClass="items-center justify-center p-[var(--spacing-page)] sm:p-6"
		>
			<form
				method="POST"
				action="?/deleteOrg"
				class="flex flex-col gap-4"
				novalidate
				use:enhance={() => {
					orgDeletePending = true;
					return async ({ result, update }) => {
						orgDeletePending = false;
						await update();
						if (result.type === 'success') applyState(result.data as OrgActionState);
					};
				}}
			>
				<input type="hidden" name="locale" value={locale} />
				<FormField label={labels.confirmName} htmlFor="org-confirm">
					{#snippet children({ invalid, describedBy })}
						<Input
							id="org-confirm"
							name="confirm_name"
							required
							maxlength={LIMITS.entityName}
							placeholder={labels.confirmNamePlaceholder.replace('{name}', organizationName)}
							autocomplete="off"
							bind:value={orgConfirmName}
							{invalid}
							{describedBy}
						/>
					{/snippet}
				</FormField>
				<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="ghost"
						class="rounded-lg px-4 py-2.5 text-sm font-semibold"
						onclick={() => {
							deleteOrgOpen = false;
							orgConfirmName = '';
						}}
					>
						{labels.cancel}
					</Button>
					<Button
						type="submit"
						class="mt-0 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]"
						disabled={orgDeletePending ||
							orgConfirmName.trim().toLowerCase() !== organizationName.trim().toLowerCase()}
					>
						{labels.confirmDelete}
					</Button>
				</div>
			</form>
		</Dialog>
	{/if}
</div>
