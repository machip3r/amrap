<script lang="ts">
	import { enhance } from '$app/forms';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { OnboardingState, OnboardingStep } from '$lib/auth/session';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import type { OnboardingActionState } from '$lib/server/onboarding/actions';
	import { LIMITS } from '$lib/validation/schemas';

	type PlanRow = { id: string; name: string; price: number; duration_days: number };

	type Props = {
		locale: Locale;
		onboardingState: OnboardingState;
		plans: PlanRow[];
		showError?: boolean;
		form: OnboardingActionState;
	};

	let { locale, onboardingState, plans, showError = false, form }: Props = $props();

	const d = getDictionary(locale);
	const maxStep = $derived(onboardingState.step);
	let viewStep = $state(onboardingState.step as OnboardingStep);
	let prevMaxStep = $state(onboardingState.step);

	$effect(() => {
		if (maxStep !== prevMaxStep) {
			prevMaxStep = maxStep;
			viewStep = maxStep;
		}
	});

	function goBack() {
		viewStep = viewStep > 1 ? ((viewStep - 1) as OnboardingStep) : viewStep;
	}

	let profilePending = $state(false);
	let gymPending = $state(false);
	let addPlanPending = $state(false);
	let editPlanPending = $state(false);
	let editingId = $state(null as string | null);
	let deleting = $state(null as PlanRow | null);
</script>

<div class="flex w-full flex-col gap-8">
	<nav aria-label={d.onboarding.stepsLabel} class="flex gap-2">
		{#each [1, 2, 3, 4] as n (n)}
			{@const active = viewStep === n}
			{@const reached = maxStep >= n}
			<button
				type="button"
				disabled={!reached}
				onclick={() => (viewStep = n as OnboardingStep)}
				class="flex flex-1 flex-col gap-1 text-left {active
					? 'opacity-100'
					: reached
						? 'opacity-70'
						: 'opacity-40'} {reached ? 'cursor-pointer' : 'cursor-default'}"
			>
				<div
					class="h-1 rounded-full {reached
						? 'bg-[var(--color-primary)]'
						: 'bg-[var(--color-muted)]/30'}"
				></div>
				<span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
					{n === 1
						? d.onboarding.stepYou
						: n === 2
							? d.onboarding.stepGym
							: n === 3
								? d.onboarding.stepPlans
								: d.onboarding.stepDone}
				</span>
			</button>
		{/each}
	</nav>

	{#if showError}
		<p
			class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
		>
			{d.onboarding.errorSave}
		</p>
	{/if}

	<div class="flex flex-col gap-3">
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
					method="POST"
					action="?/saveProfile"
					class="flex flex-col gap-4"
					novalidate
					use:enhance={() => {
						profilePending = true;
						return async ({ update }) => {
							profilePending = false;
							await update();
						};
					}}
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

					<Button type="submit" variant="primaryBlock" disabled={profilePending}>
						{profilePending ? d.onboarding.saving : d.onboarding.continue}
					</Button>
				</form>
			</section>
		{:else if viewStep === 2}
			<section class="flex flex-col gap-4">
				<div>
					<h2 class="text-xl font-bold text-[var(--color-text)]">{d.onboarding.gymTitle}</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.onboarding.gymSubtitle}</p>
				</div>

				<form
					method="POST"
					action="?/saveGym"
					class="flex flex-col gap-4"
					novalidate
					use:enhance={() => {
						gymPending = true;
						return async ({ update }) => {
							gymPending = false;
							await update();
						};
					}}
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
					<FormField
						label={d.onboarding.branchAddress}
						htmlFor="branchAddress"
						hint={d.onboarding.branchAddressHint}
						error={form?.fieldErrors?.branchAddress}
					>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="branchAddress"
								name="branchAddress"
								placeholder={d.onboarding.branchAddressPlaceholder}
								autocomplete="street-address"
								maxlength={LIMITS.address}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>

					{#if form?.error}
						<p class="text-sm font-medium text-[var(--color-primary)]">{form.error}</p>
					{/if}

					<Button type="submit" variant="primaryBlock" disabled={gymPending}>
						{gymPending ? d.onboarding.saving : d.onboarding.continue}
					</Button>
				</form>
			</section>
		{:else if viewStep === 3}
			{@const atLimit = plans.length >= 2}
			<section class="flex flex-col gap-4">
				<div>
					<h2 class="text-xl font-bold text-[var(--color-text)]">{d.onboarding.plansTitle}</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.onboarding.plansSubtitle}</p>
					<p
						class="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs leading-relaxed text-[var(--color-muted)]"
					>
						{d.onboarding.plansExample}
					</p>
					{#if onboardingState.gymName}
						<p class="mt-2 text-xs text-[var(--color-muted)]">
							{d.onboarding.gymLabel}:
							<span class="font-medium text-[var(--color-text)]">{onboardingState.gymName}</span>
						</p>
					{/if}
				</div>

				{#if plans.length > 0}
					<ul class="space-y-2 text-sm">
						{#each plans as p (p.id)}
							<li class="rounded-lg border border-[var(--color-border)] px-3 py-2">
								{#if editingId === p.id}
									<form
										method="POST"
										action="?/updatePlan"
										class="flex flex-col gap-3"
										novalidate
										use:enhance={() => {
											editPlanPending = true;
											return async ({ update }) => {
												editPlanPending = false;
												editingId = null;
												await update();
											};
										}}
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
														type="number"
														min={0}
														max={1_000_000}
														step="0.01"
														inputmode="decimal"
														value={String(p.price)}
														{invalid}
														{describedBy}
													/>
												{/snippet}
											</FormField>
											<FormField
												label={d.plans.durationDays}
												htmlFor="edit-days-{p.id}"
												error={form?.fieldErrors?.duration_days}
											>
												{#snippet children({ invalid, describedBy })}
													<Input
														id="edit-days-{p.id}"
														required
														name="duration_days"
														type="number"
														min={1}
														max={3650}
														step={1}
														inputmode="numeric"
														value={String(p.duration_days)}
														{invalid}
														{describedBy}
													/>
												{/snippet}
											</FormField>
										</div>
										{#if form?.error}
											<p class="text-sm font-medium text-[var(--color-primary)]">{form.error}</p>
										{/if}
										<div class="flex gap-2">
											<Button type="submit" class="flex-1" disabled={editPlanPending}>
												{editPlanPending ? d.onboarding.saving : d.plans.save}
											</Button>
											<Button type="button" variant="ghost" class="flex-1" onclick={() => (editingId = null)}>
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
						use:enhance={() => {
							addPlanPending = true;
							return async ({ update }) => {
								addPlanPending = false;
								await update();
							};
						}}
					>
						<input type="hidden" name="locale" value={locale} />
						<FormField
							label={d.plans.planName}
							htmlFor="plan-name"
							hint={d.onboarding.planNameHint}
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
								hint={d.onboarding.planPriceHint}
								error={form?.fieldErrors?.price}
							>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="plan-price"
										required
										name="price"
										type="number"
										min={0}
										max={1_000_000}
										step="0.01"
										inputmode="decimal"
										placeholder="500"
										{invalid}
										{describedBy}
									/>
								{/snippet}
							</FormField>
							<FormField
								label={d.plans.durationDays}
								htmlFor="plan-days"
								hint={d.onboarding.planDurationHint}
								error={form?.fieldErrors?.duration_days}
							>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="plan-days"
										required
										name="duration_days"
										type="number"
										min={1}
										max={3650}
										step={1}
										value="30"
										inputmode="numeric"
										{invalid}
										{describedBy}
									/>
								{/snippet}
							</FormField>
						</div>
						{#if form?.error}
							<p class="text-sm font-medium text-[var(--color-primary)]">{form.error}</p>
						{/if}
						<Button type="submit" variant="primaryBlock" disabled={addPlanPending}>
							{addPlanPending ? d.onboarding.saving : d.onboarding.addPlan}
						</Button>
					</form>
				{:else}
					<p class="text-sm text-[var(--color-muted)]">{d.onboarding.planLimit}</p>
				{/if}

				<form method="POST" action="?/skipPlans">
					<input type="hidden" name="locale" value={locale} />
					<Button
						type="submit"
						variant={plans.length > 0 ? 'primaryBlock' : 'ghost'}
						class={plans.length > 0 ? undefined : 'w-full py-2 text-sm'}
					>
						{plans.length > 0 ? d.onboarding.continue : d.onboarding.skipPlans}
					</Button>
				</form>
			</section>
		{:else if viewStep === 4}
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
				<form method="POST" action="?/finish">
					<input type="hidden" name="locale" value={locale} />
					<Button type="submit" variant="primaryBlock">{d.onboarding.goDashboard}</Button>
				</form>
			</section>
		{/if}

		{#if viewStep > 1}
			<Button type="button" variant="ghost" class="w-full py-2 text-sm" onclick={goBack}>
				{d.common.back}
			</Button>
		{/if}
	</div>
</div>
