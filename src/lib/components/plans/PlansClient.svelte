<script lang="ts">
	import { enhance } from '$app/forms';
	import Archive from '@lucide/svelte/icons/archive';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
	import Loader2 from '@lucide/svelte/icons/loader-circle';
	import Lock from '@lucide/svelte/icons/lock';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Users from '@lucide/svelte/icons/users';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { DayPassPriceState, PlanFormState } from '$lib/server/plans/actions';
	import { LIMITS } from '$lib/validation/schemas';

	export type PlansPagePlan = {
		id: string;
		name: string;
		price: number;
		duration_days: number;
		is_active: boolean;
		member_count: number;
	};

	type Props = {
		locale: Locale;
		d: Dictionary;
		plans: PlansPagePlan[];
		canAdd: boolean;
		activeCount: number;
		maxPlans: number | null;
		dayPassPrice: number | null;
	};

	let { locale, d, plans, canAdd, activeCount, maxPlans, dayPassPrice }: Props = $props();

	let createOpen = $state(false);
	let editing = $state<PlansPagePlan | null>(null);
	let togglingPlan = $state<PlansPagePlan | null>(null);

	let createPending = $state(false);
	let createError = $state<string | undefined>(undefined);
	let createFieldErrors = $state<Record<string, string> | undefined>(undefined);

	let editPending = $state(false);
	let editError = $state<string | undefined>(undefined);
	let editFieldErrors = $state<Record<string, string> | undefined>(undefined);

	let dayPassPending = $state(false);
	let dayPassError = $state<string | undefined>(undefined);
	let dayPassFieldErrors = $state<Record<string, string> | undefined>(undefined);
	let dayPassSuccess = $state(false);
	let dayPassValue = $state('');

	let createName = $state('');
	let createPrice = $state('');
	let createDuration = $state('30');

	let editName = $state('');
	let editPrice = $state('');
	let editDuration = $state('30');

	const showLimitCard = $derived(maxPlans != null && !canAdd);

	$effect(() => {
		dayPassValue = dayPassPrice != null ? String(dayPassPrice) : '';
	});

	$effect(() => {
		if (editing) {
			editName = editing.name;
			editPrice = String(editing.price);
			editDuration = String(editing.duration_days);
			editError = undefined;
			editFieldErrors = undefined;
		}
	});

	function formatPrice(price: number) {
		try {
			return new Intl.NumberFormat(locale, {
				style: 'currency',
				currency: 'MXN',
				maximumFractionDigits: price % 1 === 0 ? 0 : 2
			}).format(price);
		} catch {
			return `$${price}`;
		}
	}

	function formatDuration(days: number) {
		if (days === 30) return d.plans.perMonth;
		if (days % 30 === 0) {
			return d.plans.perMonths.replace('{n}', String(days / 30));
		}
		return d.plans.perDays.replace('{n}', String(days));
	}

	function membersLabel(count: number) {
		return d.plans.membersEnrolled.replace('{count}', String(count));
	}

	function resetCreateForm() {
		createName = '';
		createPrice = '';
		createDuration = '30';
		createError = undefined;
		createFieldErrors = undefined;
	}
</script>

<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div>
		<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
			{d.plans.title}
		</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">{d.plans.subtitle}</p>
		{#if maxPlans != null}
			<p class="mt-2 text-xs font-medium text-[var(--color-muted)]">
				{d.plans.quotaLabel
					.replace('{used}', String(activeCount))
					.replace('{max}', String(maxPlans))}
				<span
					class="rounded-md bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[var(--color-primary)]"
				>
					{d.plans.freemium}
				</span>
			</p>
		{/if}
	</div>
	<Button
		type="button"
		class="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-3.5 py-2 shadow-sm"
		onclick={() => {
			resetCreateForm();
			createOpen = true;
		}}
		disabled={!canAdd}
	>
		<Plus class="h-4 w-4" aria-hidden="true" />
		{d.plans.newPlan}
	</Button>
</header>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
	<article
		class="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
	>
		<div class="flex flex-1 flex-col gap-4 p-5 sm:p-6">
			<div class="flex items-start justify-between gap-3">
				<h2 class="font-title text-lg font-bold tracking-tight text-[var(--color-text)]">
					{d.plans.dayPassTitle}
				</h2>
				<span
					class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
				>
					<Ticket class="h-4 w-4" aria-hidden="true" />
				</span>
			</div>
			<p class="flex flex-wrap items-baseline gap-x-1.5">
				<span class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
					{dayPassPrice != null ? formatPrice(dayPassPrice) : d.plans.dayPassNotSet}
				</span>
				<span class="text-sm text-[var(--color-muted)]">{d.plans.dayPassSubtitle}</span>
			</p>
			<p class="text-sm text-[var(--color-muted)]">{d.plans.dayPassHint}</p>
		</div>

		<form
			method="POST"
			action="?/dayPass"
			class="flex flex-col gap-2 border-t border-[var(--color-border)] px-3 py-3"
			novalidate
			use:enhance={() => {
				dayPassPending = true;
				dayPassError = undefined;
				dayPassFieldErrors = undefined;
				dayPassSuccess = false;
				return async ({ result, update }) => {
					dayPassPending = false;
					if (result.type === 'success' || result.type === 'failure') {
						const data = result.data as DayPassPriceState;
						if (data?.fieldErrors) dayPassFieldErrors = data.fieldErrors;
						if (data?.error) dayPassError = data.error;
						if (data?.success) dayPassSuccess = true;
					}
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="locale" value={locale} />
			<div class="flex items-end gap-2">
				<FormField
					label={d.plans.dayPassPrice}
					htmlFor="day-pass-price"
					error={dayPassFieldErrors?.day_pass_price}
				>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="day-pass-price"
							name="day_pass_price"
							type="number"
							min={0}
							max={1_000_000}
							step="0.01"
							inputmode="decimal"
							required
							bind:value={dayPassValue}
							placeholder="0.00"
							{invalid}
							{describedBy}
							class="min-w-0"
						/>
					{/snippet}
				</FormField>
				<Button
					type="submit"
					class="mb-0.5 inline-flex min-h-11 shrink-0 items-center gap-2 px-4 py-2.5 shadow-sm"
					disabled={dayPassPending}
				>
					{#if dayPassPending}
						<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
					{/if}
					{dayPassPending ? d.plans.saving : d.plans.dayPassSave}
				</Button>
			</div>
			{#if dayPassError}
				<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{dayPassError}</p>
			{/if}
			{#if dayPassSuccess}
				<p class="text-sm text-[var(--color-success)]" role="status">{d.settings.saved}</p>
			{/if}
		</form>
	</article>

	{#if plans.length === 0 && !showLimitCard}
		<article
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-6 py-10 text-center shadow-sm"
		>
			<p class="text-sm text-[var(--color-muted)]">{d.plans.noPlans}</p>
			<Button
				type="button"
				class="mt-4 inline-flex min-h-11 items-center gap-1.5 shadow-sm"
				onclick={() => {
					resetCreateForm();
					createOpen = true;
				}}
			>
				<Plus class="h-4 w-4" aria-hidden="true" />
				{d.plans.newPlan}
			</Button>
		</article>
	{/if}

	{#each plans as plan (plan.id)}
		<article
			class="flex flex-col rounded-2xl border bg-[var(--color-surface)] shadow-sm transition-colors {plan.is_active
				? 'border-[var(--color-border)]'
				: 'border-dashed border-[var(--color-border)] opacity-80'}"
		>
			<div class="flex flex-1 flex-col gap-4 p-5 sm:p-6">
				<div class="flex items-start justify-between gap-3">
					<h2 class="font-title text-lg font-bold tracking-tight text-[var(--color-text)]">
						{plan.name}
					</h2>
					<span
						class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide {plan.is_active
							? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
							: 'bg-[var(--color-muted)]/15 text-[var(--color-muted)]'}"
					>
						{plan.is_active ? d.plans.active : d.plans.archived}
					</span>
				</div>
				<p class="flex flex-wrap items-baseline gap-x-1.5">
					<span class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
						{formatPrice(plan.price)}
					</span>
					<span class="text-sm text-[var(--color-muted)]">
						{formatDuration(plan.duration_days)}
					</span>
				</p>
				<p class="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
					<Users class="h-4 w-4 shrink-0" aria-hidden="true" />
					{membersLabel(plan.member_count)}
				</p>
			</div>
			<div class="flex items-center gap-1 border-t border-[var(--color-border)] px-3 py-2">
				<button
					type="button"
					onclick={() => (editing = plan)}
					class="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
				>
					<Pencil class="h-3.5 w-3.5" aria-hidden="true" />
					{d.plans.edit}
				</button>
				<button
					type="button"
					onclick={() => (togglingPlan = plan)}
					class="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
				>
					{#if plan.is_active}
						<Archive class="h-3.5 w-3.5" aria-hidden="true" />
						{d.plans.archive}
					{:else}
						<ArchiveRestore class="h-3.5 w-3.5" aria-hidden="true" />
						{d.plans.restore}
					{/if}
				</button>
			</div>
		</article>
	{/each}

	{#if showLimitCard}
		<article
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-10 text-center shadow-sm"
		>
			<div
				class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-muted)]/15 text-[var(--color-muted)]"
			>
				<Lock class="h-5 w-5" aria-hidden="true" />
			</div>
			<h2 class="font-title text-lg font-bold text-[var(--color-text)]">{d.plans.limitReached}</h2>
			<p class="mt-2 max-w-xs text-sm text-[var(--color-muted)]">{d.plans.limitReachedHint}</p>
			<a
				href="/{locale}/organization#subscription"
				class="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-[var(--color-primary-on)] shadow-sm transition-[filter] hover:brightness-[0.92]"
			>
				{d.plans.upgradePlans}
			</a>
		</article>
	{/if}
</div>

<Dialog
	open={createOpen}
	onOpenChange={(open) => {
		createOpen = open;
		if (!open) resetCreateForm();
	}}
	title={d.plans.createTitle}
	description={d.plans.createDescription}
	closeLabel={d.plans.close}
	class="max-w-lg"
>
	<form
		method="POST"
		action="?/create"
		novalidate
		use:enhance={() => {
			createPending = true;
			createError = undefined;
			createFieldErrors = undefined;
			return async ({ result, update }) => {
				createPending = false;
				if (result.type === 'success' || result.type === 'failure') {
					const data = result.data as PlanFormState;
					if (data?.fieldErrors) createFieldErrors = data.fieldErrors;
					if (data?.error) createError = data.error;
					if (data?.success) {
						createOpen = false;
						resetCreateForm();
					}
				}
				await update({ reset: false });
			};
		}}
	>
		<div class="flex flex-col gap-4">
			<input type="hidden" name="locale" value={locale} />
			<FormField label={d.plans.planName} htmlFor="create-plan-name" error={createFieldErrors?.name}>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="create-plan-name"
						name="name"
						required
						maxlength={LIMITS.entityName}
						autocomplete="off"
						bind:value={createName}
						{invalid}
						{describedBy}
					/>
				{/snippet}
			</FormField>
			<div class="grid gap-4 sm:grid-cols-2">
				<FormField label={d.plans.price} htmlFor="create-plan-price" error={createFieldErrors?.price}>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="create-plan-price"
							name="price"
							type="number"
							min={0}
							max={1_000_000}
							step="0.01"
							inputmode="decimal"
							required
							bind:value={createPrice}
							{invalid}
							{describedBy}
						/>
					{/snippet}
				</FormField>
				<FormField
					label={d.plans.durationDays}
					htmlFor="create-plan-duration"
					error={createFieldErrors?.duration_days}
				>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="create-plan-duration"
							name="duration_days"
							type="number"
							min={1}
							max={3650}
							step={1}
							inputmode="numeric"
							required
							bind:value={createDuration}
							{invalid}
							{describedBy}
						/>
					{/snippet}
				</FormField>
			</div>
			{#if createError}
				<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{createError}</p>
			{/if}
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="ghost"
					class="rounded-lg px-4 py-2.5 text-sm font-semibold"
					onclick={() => (createOpen = false)}
					disabled={createPending}
				>
					{d.plans.cancel}
				</Button>
				<Button type="submit" class="inline-flex items-center justify-center gap-2 shadow-sm" disabled={createPending}>
					{#if createPending}
						<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
					{/if}
					{createPending ? d.plans.saving : d.plans.save}
				</Button>
			</div>
		</div>
	</form>
</Dialog>

<Dialog
	open={editing != null}
	onOpenChange={(open) => {
		if (!open) editing = null;
	}}
	title={d.plans.editTitle}
	description={d.plans.editDescription}
	closeLabel={d.plans.close}
	class="max-w-lg"
>
	{#if editing}
		<form
			method="POST"
			action="?/update"
			novalidate
			use:enhance={() => {
				editPending = true;
				editError = undefined;
				editFieldErrors = undefined;
				return async ({ result, update }) => {
					editPending = false;
					if (result.type === 'success' || result.type === 'failure') {
						const data = result.data as PlanFormState;
						if (data?.fieldErrors) editFieldErrors = data.fieldErrors;
						if (data?.error) editError = data.error;
						if (data?.success) editing = null;
					}
					await update({ reset: false });
				};
			}}
		>
			<div class="flex flex-col gap-4">
				<input type="hidden" name="locale" value={locale} />
				<input type="hidden" name="plan_id" value={editing.id} />
				<FormField label={d.plans.planName} htmlFor="edit-plan-name" error={editFieldErrors?.name}>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="edit-plan-name"
							name="name"
							required
							maxlength={LIMITS.entityName}
							autocomplete="off"
							bind:value={editName}
							{invalid}
							{describedBy}
						/>
					{/snippet}
				</FormField>
				<div class="grid gap-4 sm:grid-cols-2">
					<FormField label={d.plans.price} htmlFor="edit-plan-price" error={editFieldErrors?.price}>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="edit-plan-price"
								name="price"
								type="number"
								min={0}
								max={1_000_000}
								step="0.01"
								inputmode="decimal"
								required
								bind:value={editPrice}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
					<FormField
						label={d.plans.durationDays}
						htmlFor="edit-plan-duration"
						error={editFieldErrors?.duration_days}
					>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="edit-plan-duration"
								name="duration_days"
								type="number"
								min={1}
								max={3650}
								step={1}
								inputmode="numeric"
								required
								bind:value={editDuration}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
				</div>
				{#if editError}
					<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{editError}</p>
				{/if}
				<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="ghost"
						class="rounded-lg px-4 py-2.5 text-sm font-semibold"
						onclick={() => (editing = null)}
						disabled={editPending}
					>
						{d.plans.cancel}
					</Button>
					<Button type="submit" class="inline-flex items-center justify-center gap-2 shadow-sm" disabled={editPending}>
						{#if editPending}
							<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
						{/if}
						{editPending ? d.plans.saving : d.plans.save}
					</Button>
				</div>
			</div>
		</form>
	{/if}
</Dialog>

<ConfirmDialog
	open={togglingPlan != null}
	title={togglingPlan?.is_active ? d.plans.archive : d.plans.restore}
	description={togglingPlan
		? togglingPlan.is_active
			? d.plans.archiveConfirm.replace('{name}', togglingPlan.name)
			: `${d.plans.restore}: ${togglingPlan.name}`
		: undefined}
	cancelLabel={d.plans.cancel}
	confirmLabel={togglingPlan?.is_active ? d.plans.archive : d.plans.restore}
	action="?/setActive"
	onclose={() => (togglingPlan = null)}
>
	{#if togglingPlan}
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="plan_id" value={togglingPlan.id} />
		<input type="hidden" name="is_active" value={togglingPlan.is_active ? 'false' : 'true'} />
	{/if}
</ConfirmDialog>
