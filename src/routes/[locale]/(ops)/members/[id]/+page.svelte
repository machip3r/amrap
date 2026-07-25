<script lang="ts">
	import { enhance } from "$app/forms";
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import CalendarDays from "@lucide/svelte/icons/calendar-days";
	import Mail from "@lucide/svelte/icons/mail";
	import Phone from "@lucide/svelte/icons/phone";
	import Trash2 from "@lucide/svelte/icons/trash-2";
	import QrCodeImage from "$lib/components/QrCodeImage.svelte";
	import Button from "$lib/components/ui/Button.svelte";
	import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";
	import FormField from "$lib/components/ui/FormField.svelte";
	import Select from "$lib/components/ui/Select.svelte";
	import PaymentPricingFields from "$lib/components/payments/PaymentPricingFields.svelte";
	import type { PaymentPricingMode } from "$lib/payments/pricing";
	import type { PageProps } from "./$types";
	import { brandedTitle } from '$lib/seo/document-title';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
	const member = $derived(data.member);
	const locale = $derived(data.locale!);

	let deleteOpen = $state(false);
	let renewPlanId = $state("");
	let renewMethod = $state("CASH");
	let renewPricingMode = $state<PaymentPricingMode>("FULL");
	let renewAmount = $state("");
	let careNote = $state("");
	let carePending = $state(false);
	let renewPending = $state(false);

	const renewListAmount = $derived(
		data.plans.find((p) => p.id === renewPlanId)?.price ?? data.plans[0]?.price ?? 0
	);

	const renewPricingLabels = $derived({
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

	$effect(() => {
		if (data.plans[0] && !renewPlanId) {
			renewPlanId = data.plans[0].id;
			renewAmount = String(data.plans[0].price);
		}
	});

	$effect(() => {
		careNote = data.careNote ?? "";
	});

	function onRenewPlanChange(nextId: string) {
		renewPlanId = nextId;
		renewPricingMode = "FULL";
		const plan = data.plans.find((p) => p.id === nextId);
		renewAmount = plan != null ? String(plan.price) : "";
	}

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return "?";
		if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
		return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
	}
</script>

<svelte:head>
	<title>{brandedTitle(member?.name ?? d.nav.members, data.documentBrand)}</title>
</svelte:head>

{#if data.forbidden || !member}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	{@const active = member.status === "ACTIVE"}
	<div class="flex w-full animate-fade-in-up flex-col gap-5">
		<div>
			<a
				href="/{locale}/members"
				class="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				<ArrowLeft class="h-4 w-4" aria-hidden="true" />
				{d.common.back}
			</a>
		</div>

		<header
			class="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
		>
			<div class="flex min-w-0 items-center gap-4">
				<span
					class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-lg font-bold text-[var(--color-primary)]"
				>
					{initials(member.name)}
				</span>
				<div class="min-w-0">
					<h1
						class="font-title truncate text-3xl font-bold tracking-tight text-[var(--color-text)]"
					>
						{member.name}
					</h1>
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<span
							class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {active
								? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
								: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'}"
						>
							{active ? d.members.active : d.members.expired}
						</span>
						{#if member.invite_status === "PENDING" || member.invite_status === "CANCELLED"}
							<span
								class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {member.invite_status ===
								'PENDING'
									? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
									: 'bg-[var(--color-muted)]/20 text-[var(--color-muted)]'}"
							>
								{member.invite_status === "PENDING"
									? d.inviteStatus.pending
									: d.inviteStatus.cancelled}
							</span>
						{/if}
						<span
							class="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold {member.plan_name
								? 'bg-[var(--color-primary-soft)] text-[var(--color-text)]'
								: 'bg-[var(--color-surface-hover)] text-[var(--color-muted)]'}"
						>
							{member.plan_name ?? d.members.noPlan}
						</span>
					</div>
				</div>
			</div>
		</header>

		<div class="grid gap-5 lg:grid-cols-3">
			<section
				class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6 lg:col-span-2"
			>
				<h2
					class="font-title text-lg font-bold text-[var(--color-text)]"
				>
					{d.members.profile}
				</h2>
				<dl class="mt-4 grid gap-4 sm:grid-cols-2">
					<div class="flex gap-3">
						<Mail
							class="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
							aria-hidden="true"
						/>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]"
							>
								{d.members.email}
							</dt>
							<dd
								class="mt-0.5 text-sm font-medium text-[var(--color-text)]"
							>
								{member.email ?? "—"}
							</dd>
						</div>
					</div>
					<div class="flex gap-3">
						<Phone
							class="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
							aria-hidden="true"
						/>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]"
							>
								{d.members.phone}
							</dt>
							<dd
								class="mt-0.5 text-sm font-medium text-[var(--color-text)]"
							>
								{member.phone ?? "—"}
							</dd>
						</div>
					</div>
					<div class="flex gap-3 sm:col-span-2">
						<CalendarDays
							class="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
							aria-hidden="true"
						/>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]"
							>
								{d.members.membershipExpires}
							</dt>
							<dd
								class="mt-0.5 text-sm font-medium tabular-nums {active
									? 'text-[var(--color-text)]'
									: 'text-[var(--color-danger)]'}"
							>
								{new Date(
									member.membership_expires_at,
								).toLocaleString(locale)}
							</dd>
						</div>
					</div>
				</dl>
			</section>

			<section
				class="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
			>
				<h2
					class="font-title self-start text-lg font-bold text-[var(--color-text)]"
				>
					{d.members.qrCode}
				</h2>
				<div class="mt-4">
					<QrCodeImage
						value={member.qr_code}
						alt={d.members.qrCode}
					/>
				</div>
					<p class="mt-3 hidden max-w-full break-all text-center text-[11px] text-[var(--color-muted)] sm:block">
						{member.qr_code}
					</p>
			</section>
		</div>

		<div class="grid gap-5 sm:grid-cols-2">
			<section
				class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
			>
				<h2
					class="font-title text-lg font-bold text-[var(--color-text)]"
				>
					{d.roster.careNote}
				</h2>
				<p class="mt-1 text-sm text-[var(--color-muted)]">
					{d.roster.careNoteHint}
				</p>
				<form
					method="POST"
					action="?/saveCare"
					class="mt-4 flex w-full flex-col gap-3"
					use:enhance={() => {
						carePending = true;
						return async ({ update }) => {
							carePending = false;
							await update();
						};
					}}
				>
					<input type="hidden" name="locale" value={locale} />
					<input
						type="hidden"
						name="person_id"
						value={member.person_id}
					/>
					<input type="hidden" name="member_id" value={member.id} />
					<textarea
						name="medical_note"
						rows="3"
						maxlength="500"
						bind:value={careNote}
						class="max-h-[300px] min-h-[100px] w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
					></textarea>
					<Button
						type="submit"
						variant="primary"
						class="w-full shadow-sm"
						disabled={carePending}
					>
						{d.roster.careSave}
					</Button>
				</form>
			</section>

			<section
				class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
			>
				<h2
					class="font-title text-lg font-bold text-[var(--color-text)]"
				>
					{d.members.renew}
				</h2>
				{#if data.plans.length === 0}
					<p class="mt-4 text-sm text-[var(--color-muted)]">
						{d.plans.noPlans}
					</p>
				{:else}
					<form
						method="POST"
						action="?/renew"
						class="mt-4 grid w-full gap-3"
						use:enhance={() => {
							renewPending = true;
							return async ({ update }) => {
								renewPending = false;
								await update();
							};
						}}
					>
						<input type="hidden" name="locale" value={locale} />
						<input
							type="hidden"
							name="member_id"
							value={member.id}
						/>
						<FormField
							label={d.members.selectPlan}
							htmlFor="renew-plan"
						>
							{#snippet children({ invalid, describedBy })}
								<Select
									id="renew-plan"
									name="plan_id"
									required
									bind:value={renewPlanId}
									{invalid}
									{describedBy}
									onchange={(e) =>
										onRenewPlanChange((e.currentTarget as HTMLSelectElement).value)}
								>
									{#each data.plans as plan (plan.id)}
										<option value={plan.id}>
											{plan.name} — {plan.duration_days}d
											/ ${plan.price}
										</option>
									{/each}
								</Select>
							{/snippet}
						</FormField>
						<PaymentPricingFields
							{locale}
							listAmount={renewListAmount}
							labels={renewPricingLabels}
							bind:mode={renewPricingMode}
							bind:amount={renewAmount}
							idPrefix="renew-pricing"
						/>
						<FormField
							label={d.members.paymentMethod}
							htmlFor="renew-method"
						>
							{#snippet children({ invalid, describedBy })}
								<Select
									id="renew-method"
									name="method"
									bind:value={renewMethod}
									{invalid}
									{describedBy}
								>
									<option value="CASH"
										>{d.members.cash}</option
									>
									<option value="TRANSFER"
										>{d.members.transfer}</option
									>
								</Select>
							{/snippet}
						</FormField>
						<Button
							type="submit"
							variant="primary"
							class="w-full shadow-sm"
							disabled={renewPending}
						>
							{d.members.renewSubmit}
						</Button>
					</form>
				{/if}
			</section>
		</div>

		<section
			class="rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		>
			<div
				class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="min-w-0">
					<h2
						class="font-title text-lg font-bold text-[var(--color-text)]"
					>
						{d.members.delete}
					</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">
						{d.members.confirmDelete}
					</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					class="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 self-stretch rounded-lg border border-[var(--color-danger)]/40 px-4 py-2.5 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 sm:w-auto sm:self-center"
					onclick={() => (deleteOpen = true)}
				>
					<Trash2 class="h-4 w-4 shrink-0" aria-hidden="true" />
					{d.members.delete}
				</Button>
			</div>
		</section>

		<ConfirmDialog
			open={deleteOpen}
			title={d.members.delete}
			description="{d.members.confirmDelete} ({member.name})"
			cancelLabel={d.members.cancel}
			confirmLabel={d.members.delete}
			action="?/delete"
			onclose={() => (deleteOpen = false)}
		>
			<input type="hidden" name="member_id" value={member.id} />
			<input type="hidden" name="locale" value={locale} />
		</ConfirmDialog>
	</div>
{/if}
