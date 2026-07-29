<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import MemberPayDialog, {
		type PayMode
	} from '$lib/components/member/MemberPayDialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { brandedTitle } from '$lib/seo/document-title';

	let { data, form } = $props();

	const localeTag = $derived(data.locale === 'es' ? 'es-MX' : 'en-US');
	const expired = $derived(
		data.membershipDetail
			? new Date(data.membershipDetail.expiresAt).getTime() < Date.now()
			: false
	);
	const hasActivePlan = $derived(Boolean(data.membershipDetail) && !expired);

	const daysRemaining = $derived.by(() => {
		if (!data.membershipDetail) return null;
		const end = new Date(data.membershipDetail.expiresAt);
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		end.setHours(0, 0, 0, 0);
		return Math.round((end.getTime() - start.getTime()) / 86_400_000);
	});

	const urgency = $derived(
		expired || (daysRemaining != null && daysRemaining <= 7) ? 'soon' : 'ok'
	);

	const currentPrice = $derived(data.membershipDetail?.planPrice ?? null);
	const upgradePlans = $derived(
		data.catalogPlans.filter(
			(p) =>
				p.onlineEnabled &&
				currentPrice != null &&
				p.price > currentPrice &&
				p.id !== data.membershipDetail?.planId
		)
	);
	const canUpgradeOnline = $derived(upgradePlans.length > 0);

	let payOpen = $state(false);
	let payMode = $state<PayMode>('buy');
	let preferredPlanId = $state<string | null>(null);
	let cancelOpen = $state(false);
	let deskOpen = $state(false);

	$effect(() => {
		if (form?.error && form?.intent === 'payOnline') payOpen = true;
	});

	function openPay(mode: PayMode, planId?: string | null) {
		if (!data.onlinePayAvailable) {
			deskOpen = true;
			return;
		}
		if (mode === 'upgrade' && !canUpgradeOnline) {
			deskOpen = true;
			return;
		}
		payMode = mode;
		preferredPlanId =
			planId ??
			(mode === 'renew' ? data.membershipDetail?.planId : null) ??
			upgradePlans[0]?.id ??
			null;
		payOpen = true;
	}

	function methodLabel(method: string) {
		if (method === 'CASH') return data.d.payments.cash;
		if (method === 'TRANSFER') return data.d.payments.transfer;
		if (method === 'ONLINE') return data.d.member.payMethodOnline;
		return method;
	}

	function money(amount: number) {
		return new Intl.NumberFormat(localeTag, {
			style: 'currency',
			currency: 'MXN',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function remainingLabel(days: number) {
		if (days < 0) return data.d.member.statusExpired;
		if (days === 0) return data.d.member.expiresToday;
		if (days === 1) return data.d.member.dayLeft;
		return data.d.member.daysLeft.replace('{count}', String(days));
	}

	function planAction(plan: (typeof data.catalogPlans)[number]): {
		label: string;
		mode: PayMode;
	} | null {
		if (!plan.onlineEnabled) return null;
		if (!hasActivePlan) return { label: data.d.member.payCta, mode: 'buy' };
		if (plan.id === data.membershipDetail?.planId) {
			return { label: data.d.member.renewMembership, mode: 'renew' };
		}
		if (currentPrice != null && plan.price > currentPrice) {
			return { label: data.d.member.payCta, mode: 'upgrade' };
		}
		return { label: data.d.member.payCta, mode: 'buy' };
	}

	const gatewayOptions = $derived(
		data.gateways.map((g) => ({
			id: g.id,
			label: data.d.settings[g.labelKey],
			available: g.available
		}))
	);
</script>

<svelte:head>
	<title>{brandedTitle(data.d.member.membership, data.documentBrand)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-6">
	<header class="flex flex-col gap-1">
		<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
			{data.d.member.membership}
		</h1>
		<p class="text-sm text-[var(--color-muted)]">
			{data.d.member.membershipSubtitle}
			{#if data.activeGym}
				· {data.activeGym.gymName}
			{/if}
		</p>
	</header>

	{#if data.billingFlash}
		<p
			class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)]"
			role="status"
		>
			{data.billingFlash}
		</p>
	{/if}
	{#if form?.error && form?.intent === 'cancel'}
		<p class="text-sm text-[var(--color-danger)]" role="alert">{form.error}</p>
	{/if}

	{#if data.membershipDetail}
		<section
			class="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
			aria-labelledby="membership-status-heading"
		>
			<div
				class="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[var(--color-primary)]/10 blur-2xl"
				aria-hidden="true"
			></div>
			<div class="relative flex flex-col gap-5">
				<div class="min-w-0">
					<h2
						id="membership-status-heading"
						class="font-title text-lg font-bold text-[var(--color-text)]"
					>
						{data.d.member.membershipStatus}
					</h2>
					<p
						class="mt-3 font-title text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl"
					>
						{data.membershipDetail.planName ?? data.d.member.noPlanAssigned}
					</p>
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<span
							class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold {expired
								? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
								: urgency === 'soon'
									? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
									: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}"
						>
							{expired ? data.d.member.statusExpired : data.d.member.statusActive}
						</span>
						{#if daysRemaining != null}
							<span class="text-sm text-[var(--color-muted)]">
								{remainingLabel(daysRemaining)}
								·
								{data.d.member.activeUntil}
								{new Date(data.membershipDetail.expiresAt).toLocaleDateString(localeTag)}
							</span>
						{/if}
					</div>
					{#if urgency === 'soon' && !expired}
						<p
							class="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]"
						>
							<Sparkles class="h-3.5 w-3.5" aria-hidden="true" />
							{data.d.member.renewSoon}
						</p>
					{/if}
				</div>

				{#if hasActivePlan}
					<div class="flex w-full flex-row items-center justify-end">
						<Button
							type="button"
							variant="ghost"
							class="min-h-[var(--touch-target)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
							onclick={() => (cancelOpen = true)}
						>
							{data.d.member.cancelMembership}
						</Button>
					</div>
				{:else}
					<div class="flex w-full flex-col gap-2 sm:max-w-xs">
						<Button
							type="button"
							variant="primary"
							class="w-full shadow-sm"
							onclick={() => openPay('buy', data.membershipDetail?.planId)}
						>
							{data.d.member.reactivateMembership}
						</Button>
						{#if !data.onlinePayAvailable}
							<p class="text-xs text-[var(--color-muted)]">{data.d.member.payAtDeskBody}</p>
						{/if}
					</div>
				{/if}
			</div>
		</section>
	{:else}
		<section
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
			aria-labelledby="membership-status-heading"
		>
			<h2
				id="membership-status-heading"
				class="font-title text-lg font-bold text-[var(--color-text)]"
			>
				{data.d.member.membershipStatus}
			</h2>
			<p class="mt-3 text-sm text-[var(--color-muted)]">{data.d.member.membershipEmpty}</p>
			{#if data.onlinePayAvailable || data.catalogPlans.length > 0}
				<div class="mt-4">
					<Button type="button" variant="primary" class="w-full sm:w-auto" onclick={() => openPay('buy')}>
						{data.d.member.payOnline}
					</Button>
				</div>
			{/if}
		</section>
	{/if}

	<section aria-labelledby="gym-plans-heading">
		<div class="mb-3">
			<h2 id="gym-plans-heading" class="font-title text-lg font-bold text-[var(--color-text)]">
				{data.d.member.gymPlans}
			</h2>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{data.d.member.gymPlansHint}</p>
		</div>
		{#if data.catalogPlans.length === 0}
			<p class="text-sm text-[var(--color-muted)]">{data.d.member.noGymPlans}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each data.catalogPlans as plan (plan.id)}
					{@const action = planAction(plan)}
					<li
						class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition-colors {plan.id ===
						data.membershipDetail?.planId
							? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5'
							: ''}"
					>
						<div class="min-w-0">
							<p class="font-semibold text-[var(--color-text)]">
								{plan.name}
								{#if plan.id === data.membershipDetail?.planId}
									<span class="ml-1 text-xs font-medium text-[var(--color-primary)]">
										· {data.d.member.currentPlan}
									</span>
								{/if}
							</p>
							<p class="mt-0.5 text-sm text-[var(--color-muted)]">
								{plan.durationDays}
								{data.d.member.planDays}
								·
								<span class="font-semibold text-[var(--color-text)]">{money(plan.price)}</span>
							</p>
						</div>
						<div class="flex items-center gap-2">
							{#if plan.onlineEnabled}
								<span
									class="rounded-md bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-primary)]"
								>
									{data.d.member.planOnlineBadge}
								</span>
							{/if}
							{#if action}
								<Button
									type="button"
									variant="toolbarSecondary"
									class="h-9 min-h-9 w-[11.5rem] shrink-0 justify-center px-3 text-xs"
									onclick={() => openPay(action.mode, plan.id)}
								>
									{action.label}
								</Button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section aria-labelledby="payment-history-heading">
		<h2
			id="payment-history-heading"
			class="mb-3 font-title text-lg font-bold text-[var(--color-text)]"
		>
			{data.d.member.paymentHistory}
		</h2>
		{#if data.recentPayments.length === 0}
			<p class="text-sm text-[var(--color-muted)]">{data.d.member.noPayments}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each data.recentPayments as pay (pay.id)}
					<li
						class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
					>
						<div class="min-w-0">
							<p class="font-semibold text-[var(--color-text)]">
								{pay.planName ??
									(pay.kind === 'DAY_PASS'
										? data.d.payments.kindDayPass
										: data.d.payments.kindPlan)}
							</p>
							<p class="text-xs text-[var(--color-muted)]">
								{new Date(pay.createdAt).toLocaleString(localeTag)} · {methodLabel(pay.method)}
							</p>
						</div>
						<p class="font-title text-base font-bold text-[var(--color-text)]">
							{money(pay.amount)}
						</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if data.gyms.length > 1}
		<section aria-labelledby="member-gyms-heading">
			<h2
				id="member-gyms-heading"
				class="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
			>
				{data.d.member.gyms}
			</h2>
			<ul class="flex flex-col gap-2">
				{#each data.gyms as g (g.gymId)}
					<li
						class="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 {g.gymId ===
						data.member.activeGymId
							? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
							: 'border-[var(--color-border)] bg-[var(--color-surface)]'}"
					>
						<div class="min-w-0">
							<p class="font-semibold text-[var(--color-text)]">{g.gymName}</p>
							<p class="text-xs text-[var(--color-muted)]">
								{data.d.member.activeUntil}
								{new Date(g.expiresAt).toLocaleDateString(localeTag)}
							</p>
						</div>
						{#if g.gymId !== data.member.activeGymId}
							<form method="POST" action="?/switchGym">
								<input type="hidden" name="locale" value={data.locale} />
								<input type="hidden" name="gym_id" value={g.gymId} />
								<Button type="submit" variant="toolbarSecondary" class="h-9 min-h-9 px-3 text-xs">
									{data.d.member.switchGym}
								</Button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

{#if data.onlinePayAvailable}
	<MemberPayDialog
		open={payOpen}
		onOpenChange={(v) => (payOpen = v)}
		locale={data.locale}
		d={data.d}
		plans={data.catalogPlans}
		gateways={gatewayOptions}
		mode={payMode}
		currentPlanId={data.membershipDetail?.planId ?? null}
		currentPlanPrice={currentPrice}
		{preferredPlanId}
		{money}
		formError={form?.intent === 'payOnline' ? (form?.error ?? null) : null}
	/>
{/if}

<Dialog
	open={deskOpen}
	onOpenChange={(v) => (deskOpen = v)}
	title={data.d.member.payAtDeskTitle}
	description={data.d.member.payAtDeskBody}
	closeLabel={data.d.payments.close}
	class="max-w-md"
>
	<Button type="button" variant="primary" class="w-full" onclick={() => (deskOpen = false)}>
		{data.d.payments.close}
	</Button>
</Dialog>

{#if hasActivePlan}
	<ConfirmDialog
		open={cancelOpen}
		title={data.d.member.cancelMembershipTitle}
		description={data.d.member.cancelMembershipBody}
		cancelLabel={data.d.member.cancel}
		confirmLabel={data.d.member.cancelMembershipConfirm}
		action="?/cancelMembership"
		onclose={() => (cancelOpen = false)}
	>
		<input type="hidden" name="locale" value={data.locale} />
	</ConfirmDialog>
{/if}
