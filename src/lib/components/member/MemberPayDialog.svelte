<script lang="ts">
	import { enhance } from '$app/forms';
	import Check from '@lucide/svelte/icons/check';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { Locale } from '$lib/i18n/config';

	export type PayPlanOption = {
		id: string;
		name: string;
		price: number;
		durationDays: number;
		onlineEnabled: boolean;
	};

	export type PayGatewayOption = {
		id: string;
		label: string;
		available: boolean;
	};

	export type PayMode = 'renew' | 'upgrade' | 'buy';

	type Props = {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		locale: Locale;
		d: Dictionary;
		plans: PayPlanOption[];
		gateways: PayGatewayOption[];
		mode?: PayMode;
		/** Current membership plan — renew prefers it; upgrade filters above its price. */
		currentPlanId?: string | null;
		currentPlanPrice?: number | null;
		preferredPlanId?: string | null;
		money: (n: number) => string;
		formError?: string | null;
	};

	let {
		open,
		onOpenChange,
		locale,
		d,
		plans,
		gateways,
		mode = 'buy',
		currentPlanId = null,
		currentPlanPrice = null,
		preferredPlanId = null,
		money,
		formError = null
	}: Props = $props();

	const availableGateways = $derived(gateways.filter((g) => g.available));

	const onlinePlans = $derived.by(() => {
		const online = plans.filter((p) => p.onlineEnabled);
		if (mode === 'upgrade') {
			const floor = currentPlanPrice ?? 0;
			return online.filter((p) => p.price > floor);
		}
		if (mode === 'renew' && currentPlanId) {
			const current = online.find((p) => p.id === currentPlanId);
			if (current) return [current];
		}
		return online;
	});

	/** Always gateway → plan → confirm — this surface is for PSP checkout. */
	const steps = $derived.by(() => {
		if (availableGateways.length === 0 || onlinePlans.length === 0) {
			return [] as Array<'gateway' | 'plan' | 'confirm'>;
		}
		return ['gateway', 'plan', 'confirm'] as const;
	});

	let stepIndex = $state(0);
	let gatewayId = $state('');
	let planId = $state('');
	let submitting = $state(false);

	const step = $derived(steps[stepIndex] ?? 'confirm');
	const selectedPlan = $derived(onlinePlans.find((p) => p.id === planId) ?? null);
	const selectedGateway = $derived(
		availableGateways.find((g) => g.id === gatewayId) ?? availableGateways[0] ?? null
	);

	const dialogTitle = $derived(
		mode === 'renew'
			? d.member.renewMembership
			: mode === 'upgrade'
				? d.member.upgradeMembership
				: d.member.payOnline
	);

	$effect(() => {
		if (!open) return;
		stepIndex = 0;
		submitting = false;
		gatewayId = availableGateways[0]?.id ?? '';
		const preferred =
			onlinePlans.find((p) => p.id === preferredPlanId) ??
			onlinePlans.find((p) => p.id === currentPlanId) ??
			onlinePlans[0] ??
			null;
		planId = preferred?.id ?? '';
	});

	function close() {
		onOpenChange(false);
	}

	function next() {
		if (step === 'gateway' && !gatewayId) return;
		if (step === 'plan' && !planId) return;
		if (stepIndex < steps.length - 1) stepIndex += 1;
	}

	function back() {
		if (stepIndex > 0) stepIndex -= 1;
	}

	const canAdvance = $derived(
		(step === 'gateway' && Boolean(gatewayId)) ||
			(step === 'plan' && Boolean(planId)) ||
			step === 'confirm'
	);

	const stepTitle = $derived(
		step === 'gateway'
			? d.member.payStepGateway
			: step === 'plan'
				? d.member.payStepPlan
				: d.member.payStepConfirm
	);
</script>

<Dialog
	{open}
	onOpenChange={(v) => {
		if (!v) close();
		else onOpenChange(true);
	}}
	title={dialogTitle}
	description={stepTitle}
	closeLabel={d.payments.close}
	bodyClass="px-5 py-4 sm:px-6 sm:py-5"
	containerClass="items-end justify-center p-0 sm:items-center sm:p-6 sm:pt-[max(0.75rem,var(--safe-top))] sm:pb-[max(0.75rem,var(--safe-bottom))]"
	class="max-h-[min(92dvh,40rem)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl"
>
	<div class="flex flex-col gap-4">
		{#if steps.length > 0}
			<ol class="flex items-center justify-center gap-2" aria-label={d.member.payStepsLabel}>
				{#each steps as s, i (s)}
					<li class="flex items-center gap-2">
						<span
							class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors {i ===
							stepIndex
								? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
								: i < stepIndex
									? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
									: 'bg-[var(--color-surface-hover)] text-[var(--color-muted)]'}"
							aria-current={i === stepIndex ? 'step' : undefined}
						>
							{#if i < stepIndex}
								<Check class="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
							{:else}
								{i + 1}
							{/if}
						</span>
						{#if i < steps.length - 1}
							<span class="h-px w-6 bg-[var(--color-border)] sm:w-8" aria-hidden="true"></span>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}

		{#if formError}
			<p
				class="rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]"
				role="alert"
			>
				{formError}
			</p>
		{/if}

		{#if onlinePlans.length === 0 || availableGateways.length === 0}
			<p class="text-sm text-[var(--color-muted)]" role="status">
				{mode === 'upgrade' ? d.member.upgradeNoPlans : d.member.payOnlineUnavailable}
			</p>
			<Button type="button" variant="toolbarSecondary" class="w-full" onclick={close}>
				{d.payments.close}
			</Button>
		{:else if step === 'gateway'}
			<div class="flex flex-col gap-2" role="radiogroup" aria-label={d.member.payStepGateway}>
				{#each availableGateways as g (g.id)}
					<button
						type="button"
						role="radio"
						aria-checked={gatewayId === g.id}
						class="flex min-h-[var(--touch-target)] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors {gatewayId ===
						g.id
							? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
							: 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'}"
						onclick={() => (gatewayId = g.id)}
					>
						<span
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
						>
							<Wallet class="h-5 w-5" aria-hidden="true" />
						</span>
						<span class="min-w-0 flex-1 font-semibold text-[var(--color-text)]">{g.label}</span>
						{#if gatewayId === g.id}
							<Check class="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
						{/if}
					</button>
				{/each}
			</div>
		{:else if step === 'plan'}
			<div
				class="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto"
				role="radiogroup"
				aria-label={d.member.payStepPlan}
			>
				{#each onlinePlans as plan (plan.id)}
					<button
						type="button"
						role="radio"
						aria-checked={planId === plan.id}
						class="flex min-h-[var(--touch-target)] flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors {planId ===
						plan.id
							? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
							: 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'}"
						onclick={() => (planId = plan.id)}
					>
						<span class="flex items-start justify-between gap-2">
							<span class="font-semibold text-[var(--color-text)]">{plan.name}</span>
							<span class="shrink-0 font-title text-base font-bold text-[var(--color-text)]">
								{money(plan.price)}
							</span>
						</span>
						<span class="text-xs text-[var(--color-muted)]">
							{plan.durationDays}
							{d.member.planDays}
						</span>
					</button>
				{/each}
			</div>
		{:else}
			<div
				class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/60 px-4 py-4"
			>
				<p class="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
					{d.member.paySummary}
				</p>
				{#if selectedPlan}
					<p class="mt-2 font-title text-xl font-bold text-[var(--color-text)]">
						{selectedPlan.name}
					</p>
					<p class="mt-1 text-sm text-[var(--color-muted)]">
						{selectedPlan.durationDays}
						{d.member.planDays} · {money(selectedPlan.price)}
					</p>
				{/if}
				{#if selectedGateway}
					<p class="mt-3 text-sm text-[var(--color-text)]">
						<span class="text-[var(--color-muted)]">{d.member.payVia}</span>
						{selectedGateway.label}
					</p>
				{/if}
				<p class="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
					{mode === 'renew'
						? d.member.renewConfirmHint
						: mode === 'upgrade'
							? d.member.upgradeConfirmHint
							: d.member.payConfirmHint}
				</p>
			</div>
		{/if}

		{#if onlinePlans.length > 0 && availableGateways.length > 0}
			<div
				class="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row-reverse sm:items-center"
			>
				{#if step === 'confirm'}
					<form
						method="POST"
						action="?/payOnline"
						class="contents"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								submitting = false;
								await update();
							};
						}}
					>
						<input type="hidden" name="locale" value={locale} />
						<input type="hidden" name="plan_id" value={planId} />
						<input type="hidden" name="provider" value={selectedGateway?.id ?? 'MERCADOPAGO'} />
						<Button
							type="submit"
							variant="primary"
							class="w-full sm:flex-1"
							disabled={submitting || !planId}
						>
							{submitting ? d.member.payRedirecting : d.member.payContinueToGateway}
						</Button>
					</form>
				{:else}
					<Button
						type="button"
						variant="primary"
						class="w-full sm:flex-1"
						disabled={!canAdvance}
						onclick={next}
					>
						{d.common.next}
					</Button>
				{/if}
				{#if stepIndex > 0}
					<Button type="button" variant="toolbarSecondary" class="w-full sm:w-auto" onclick={back}>
						<span class="inline-flex items-center gap-1">
							<ChevronLeft class="h-4 w-4" aria-hidden="true" />
							{d.common.previous}
						</span>
					</Button>
				{:else}
					<Button type="button" variant="toolbarSecondary" class="w-full sm:w-auto" onclick={close}>
						{d.member.cancel}
					</Button>
				{/if}
			</div>
		{/if}
	</div>
</Dialog>
