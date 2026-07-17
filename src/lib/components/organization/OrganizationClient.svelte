<script lang="ts">
	import { enhance } from '$app/forms';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Plus from '@lucide/svelte/icons/plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import { formatMoney } from '$lib/i18n/money';
	import {
		AMRAP_PLANS,
		ORG_DELETION_RETENTION_DAYS,
		canCreateGym,
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

	type Props = {
		locale: Locale;
		d: Dictionary;
		organizationName: string;
		planTier: OrgPlanTier;
		gyms: OrgGymRow[];
	};

	let { locale, d, organizationName, planTier, gyms }: Props = $props();

	const labels = $derived(d.organization);

	let createOpen = $state(false);
	let deleteGym = $state<OrgGymRow | null>(null);
	let deleteOrgOpen = $state(false);
	let orgConfirmName = $state('');
	let gymConfirmName = $state('');

	let flash = $state<string | undefined>(undefined);
	let flashError = $state<string | undefined>(undefined);
	let checkoutPending = $state(false);
	let createPending = $state(false);
	let gymDeletePending = $state(false);
	let gymCancelPending = $state(false);
	let orgDeletePending = $state(false);

	const activeGymCount = $derived(gyms.filter((g) => !g.deleted_at).length);
	const gymCap = $derived(maxGyms(planTier));
	const canAddGym = $derived(canCreateGym(planTier, activeGymCount));
	const needsUpgradeForGym = $derived(!canAddGym);

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
		} else if (data.message) {
			flash = data.message;
			flashError = undefined;
		}
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
		id="subscription"
		class="scroll-mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-4 sm:px-5"
	>
		<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
			<h2 class="text-sm font-semibold text-[var(--color-text)]">{labels.subscriptionTitle}</h2>
			<p class="text-xs text-[var(--color-muted)]">
				{labels.currentPlan}:
				<span class="font-semibold text-[var(--color-text)]">{planLabel(planTier)}</span>
			</p>
		</div>

		<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
			{#each AMRAP_PLANS as plan (plan.tier)}
				{@const isCurrent = plan.tier === planTier}
				{@const pricing = priceLine(plan.tier)}
				<article
					class="flex flex-col rounded-lg border px-3 py-3 {isCurrent
						? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5'
						: 'border-[var(--color-border)]/80'}"
				>
					<div class="flex items-center justify-between gap-2">
						<h3 class="text-sm font-semibold text-[var(--color-text)]">{planLabel(plan.tier)}</h3>
						{#if isCurrent}
							<span
								class="rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-success)]"
							>
								{labels.current}
							</span>
						{/if}
					</div>
					<p class="mt-2 text-lg font-bold tabular-nums text-[var(--color-text)]">
						{pricing.amount}
					</p>
					<p class="text-[11px] leading-snug text-[var(--color-muted)]">{pricing.note}</p>
					{#if plan.tier !== 'FREEMIUM' && !isCurrent}
						{#if plan.priceNote === 'contact'}
							<a href="mailto:hello@amrap.space?subject=AMRAP%20Pro" class="mt-auto pt-3">
								<Button
									type="button"
									variant="ghost"
									class="mt-0 h-8 w-full px-2 text-xs font-semibold"
								>
									{labels.contactSales}
								</Button>
							</a>
						{:else}
							<form
								method="POST"
								action="?/checkout"
								class="mt-auto pt-3"
								use:enhance={() => {
									checkoutPending = true;
									return async ({ result, update }) => {
										checkoutPending = false;
										await update();
										if (result.type === 'success') applyState(result.data as OrgActionState);
									};
								}}
							>
								<input type="hidden" name="locale" value={locale} />
								<input type="hidden" name="tier" value={plan.tier} />
								<Button
									type="submit"
									variant="ghost"
									class="mt-0 h-8 w-full px-2 text-xs font-semibold"
									disabled={checkoutPending}
								>
									{labels.upgrade}
								</Button>
							</form>
						{/if}
					{:else}
						<div class="mt-auto pt-3"></div>
					{/if}
				</article>
			{/each}
		</div>
	</section>

	<section
		id="gyms"
		class="scroll-mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	>
		<div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div>
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
					class="mt-0 inline-flex shrink-0 items-center gap-1.5 shadow-sm"
					onclick={() => (createOpen = true)}
				>
					<Plus class="h-4 w-4" aria-hidden="true" />
					{labels.addGym}
				</Button>
			{/if}
		</div>

		<ul class="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
			{#each gyms as gym (gym.id)}
				<li
					class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="min-w-0">
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
					<div class="flex flex-wrap gap-2">
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
								<Button
									type="submit"
									variant="ghost"
									class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold"
									disabled={gymCancelPending}
								>
									<RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
									{labels.cancelDeletion}
								</Button>
							</form>
						{:else}
							<Button
								type="button"
								variant="ghost"
								class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-danger)] hover:text-[var(--color-danger)]"
								onclick={() => {
									deleteGym = gym;
									gymConfirmName = '';
								}}
							>
								<Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
								{labels.deleteGym}
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section
		id="danger"
		class="scroll-mt-6 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	>
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex min-w-0 items-start gap-3">
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
			<Button
				type="button"
				variant="ghost"
				class="inline-flex shrink-0 self-start items-center gap-1.5 rounded-lg border border-[var(--color-danger)]/40 px-4 py-2.5 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] sm:self-center"
				onclick={() => {
					deleteOrgOpen = true;
					orgConfirmName = '';
				}}
			>
				<Trash2 class="h-4 w-4" aria-hidden="true" />
				{labels.deleteOrg}
			</Button>
		</div>
	</section>

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
		class="max-w-lg"
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
		class="max-w-lg"
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
</div>
