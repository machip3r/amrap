<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import X from '@lucide/svelte/icons/x';
	import CreateMemberDialog from '$lib/components/members/CreateMemberDialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
	import type { CreatePaymentState } from '$lib/server/payments/actions';

	export type PaymentMemberOption = {
		id: string;
		name: string;
		email?: string | null;
	};

	export type PaymentPlanOption = {
		id: string;
		name: string;
		price: number;
		duration_days: number;
	};

	type PaymentKind = 'plan' | 'day_pass';

	type Props = {
		locale: Locale;
		d: Dictionary;
		members: PaymentMemberOption[];
		plans: PaymentPlanOption[];
		dayPassPrice: number | null;
		canManageMembers?: boolean;
		onSuccess?: (paymentId: string) => void;
	};

	let {
		locale,
		d,
		members,
		plans,
		dayPassPrice,
		canManageMembers = false,
		onSuccess
	}: Props = $props();

	let open = $state(false);
	let createOpen = $state(false);
	let formKey = $state(0);

	let memberId = $state('');
	let kind = $state<PaymentKind>('plan');
	let planId = $state('');
	let amount = $state('');
	let method = $state('cash');
	let pending = $state(false);
	let localError = $state<string | undefined>(undefined);
	let localFieldErrors = $state<Record<string, string> | undefined>(undefined);

	let memberQuery = $state('');
	let memberListOpen = $state(false);
	let activeIndex = $state(0);
	let rootEl: HTMLDivElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();
	let memberOptions = $state<PaymentMemberOption[]>([]);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;
	let searchAbort: AbortController | null = null;

	$effect(() => {
		memberOptions = members;
	});

	$effect(() => {
		return () => {
			cancelMemberSearch();
		};
	});

	const selectedMember = $derived(
		memberOptions.find((m) => m.id === memberId) ??
			members.find((m) => m.id === memberId) ??
			null
	);
	const fe = $derived(localFieldErrors);

	const filteredMembers = $derived.by(() => {
		const q = memberQuery.trim().toLowerCase();
		const list = memberOptions;
		return [...list]
			.sort((a, b) => {
				if (!q) return a.name.localeCompare(b.name);
				const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
				const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
				if (aStarts !== bStarts) return aStarts - bStarts;
				return a.name.localeCompare(b.name);
			})
			.slice(0, 8);
	});

	/** Combobox rows: optional register action at index 0, then members. */
	const registerRowOffset = $derived(canManageMembers ? 1 : 0);
	const optionCount = $derived(registerRowOffset + filteredMembers.length);

	function cancelMemberSearch() {
		if (searchTimer) {
			clearTimeout(searchTimer);
			searchTimer = null;
		}
		searchAbort?.abort();
		searchAbort = null;
	}

	async function searchMembersRemote(q: string) {
		searchAbort?.abort();
		const controller = new AbortController();
		searchAbort = controller;
		try {
			const body = new FormData();
			body.set('q', q);
			const response = await fetch('?/searchMembers', {
				method: 'POST',
				body,
				headers: { 'x-sveltekit-action': 'true' },
				signal: controller.signal
			});
			const actionResult = deserialize(await response.text());
			if (actionResult.type === 'success' || actionResult.type === 'failure') {
				const data = actionResult.data as { members?: PaymentMemberOption[] } | undefined;
				if (data?.members) memberOptions = data.members;
			}
		} catch (err) {
			// Navigating away / closing the dialog aborts in-flight search — not an error.
			if (err instanceof DOMException && err.name === 'AbortError') return;
			if (err instanceof Error && err.name === 'AbortError') return;
			console.error('searchMembersRemote', err);
		} finally {
			if (searchAbort === controller) searchAbort = null;
		}
	}

	function onMemberQueryInput() {
		activeIndex = 0;
		memberListOpen = true;
		if (selectedMember && memberQuery !== selectedMember.name) {
			memberId = '';
		}
		if (searchTimer) clearTimeout(searchTimer);
		const q = memberQuery.trim();
		searchTimer = setTimeout(() => {
			void searchMembersRemote(q);
		}, 250);
	}

	const safeActiveIndex = $derived(
		optionCount === 0 ? 0 : Math.min(activeIndex, optionCount - 1)
	);

	const canSubmit = $derived(
		Boolean(memberId) &&
			(kind === 'day_pass' ? dayPassPrice != null : Boolean(planId) && plans.length > 0) &&
			!pending
	);

	const canOpenPayment = $derived(members.length > 0 || canManageMembers);

	const showList = $derived(
		memberListOpen && (canManageMembers || filteredMembers.length > 0)
	);
	const showEmpty = $derived(
		memberListOpen &&
			!canManageMembers &&
			memberQuery.trim().length > 0 &&
			filteredMembers.length === 0
	);
	const showNoMatchesHint = $derived(
		canManageMembers && memberQuery.trim().length > 0 && filteredMembers.length === 0
	);

	function formatMoney(value: number) {
		try {
			return new Intl.NumberFormat(locale, {
				style: 'currency',
				currency: 'MXN',
				maximumFractionDigits: value % 1 === 0 ? 0 : 2
			}).format(value);
		} catch {
			return `$${value}`;
		}
	}

	function resetForm() {
		cancelMemberSearch();
		const nextKind: PaymentKind =
			plans.length > 0 ? 'plan' : dayPassPrice != null ? 'day_pass' : 'plan';
		memberId = '';
		memberQuery = '';
		kind = nextKind;
		planId = plans[0]?.id ?? '';
		amount =
			nextKind === 'day_pass' && dayPassPrice != null
				? String(dayPassPrice)
				: plans[0] != null
					? String(plans[0].price)
					: '';
		method = 'cash';
		localError = undefined;
		localFieldErrors = undefined;
		memberListOpen = false;
		activeIndex = 0;
	}

	function openDialog() {
		resetForm();
		formKey += 1;
		open = true;
	}

	function pickMember(member: PaymentMemberOption) {
		cancelMemberSearch();
		memberId = member.id;
		memberQuery = member.name;
		memberListOpen = false;
		inputEl?.blur();
	}

	function openCreateMember() {
		cancelMemberSearch();
		memberListOpen = false;
		createOpen = true;
	}

	function onMemberCreated(
		newMemberId: string,
		meta?: { name: string; email: string }
	) {
		const option: PaymentMemberOption = {
			id: newMemberId,
			name: meta?.name?.trim() || d.payments.member,
			email: meta?.email?.trim() || null
		};
		if (!memberOptions.some((m) => m.id === newMemberId)) {
			memberOptions = [option, ...memberOptions];
		}
		pickMember(option);
	}

	function clearMember() {
		cancelMemberSearch();
		memberId = '';
		memberQuery = '';
		activeIndex = 0;
		memberListOpen = true;
		inputEl?.focus();
	}

	function applyKind(next: PaymentKind) {
		kind = next;
		if (next === 'day_pass') {
			amount = dayPassPrice != null ? String(dayPassPrice) : '';
			return;
		}
		const plan = plans.find((p) => p.id === planId) ?? plans[0] ?? null;
		if (plan && !planId) planId = plan.id;
		amount = plan != null ? String(plan.price) : '';
	}

	function applyPlan(nextId: string) {
		planId = nextId;
		const plan = plans.find((p) => p.id === nextId);
		if (plan) amount = String(plan.price);
	}

	function onMemberKeyDown(e: KeyboardEvent) {
		if (!memberListOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
			memberListOpen = true;
			return;
		}
		if (!memberListOpen) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, Math.max(optionCount - 1, 0));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (canManageMembers && safeActiveIndex === 0) {
				openCreateMember();
				return;
			}
			const memberIndex = safeActiveIndex - registerRowOffset;
			const pickMe = filteredMembers[memberIndex];
			if (pickMe) pickMember(pickMe);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			memberListOpen = false;
			if (selectedMember) memberQuery = selectedMember.name;
		}
	}

	function initials(name: string) {
		return (
			name
				.trim()
				.split(/\s+/)
				.slice(0, 2)
				.map((p) => p[0]?.toUpperCase() ?? '')
				.join('') || '?'
		);
	}

	function escapeRegExp(value: string) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function highlightParts(text: string, query: string) {
		const q = query.trim();
		if (!q) return [{ text, match: false }];
		const re = new RegExp(`(${escapeRegExp(q)})`, 'ig');
		const parts = text.split(re);
		return parts.filter(Boolean).map((part) => ({
			text: part,
			match: part.toLowerCase() === q.toLowerCase()
		}));
	}

	$effect(() => {
		if (!memberListOpen) return;
		function onPointerDown(e: MouseEvent) {
			if (!rootEl?.contains(e.target as Node)) {
				memberListOpen = false;
				if (selectedMember) memberQuery = selectedMember.name;
			}
		}
		document.addEventListener('mousedown', onPointerDown);
		return () => document.removeEventListener('mousedown', onPointerDown);
	});
</script>

<Button
	type="button"
	variant="toolbar"
	onclick={openDialog}
	disabled={!canOpenPayment}
>
	<Plus class="h-4 w-4 shrink-0" aria-hidden="true" />
	<span class="shrink-0">{d.payments.newPayment}</span>
</Button>

<Dialog
	{open}
	onOpenChange={(next) => {
		// Keep payment dialog open while the nested create-member dialog is up.
		if (!next && createOpen) return;
		open = next;
		if (!next) resetForm();
	}}
	title={d.payments.newPayment}
	description={d.payments.description}
	closeLabel={d.payments.close}
	class="max-w-3xl sm:max-w-4xl"
	bodyClass="overflow-visible px-8 py-6"
	autoFocus={false}
>
	{#if open}
		{#if !canOpenPayment}
			<p class="text-sm text-[var(--color-muted)]">{d.payments.noMembers}</p>
		{:else}
			<form
				method="POST"
				action="?/create"
				class="flex flex-col gap-4"
				novalidate
				use:enhance={() => {
					pending = true;
					localError = undefined;
					localFieldErrors = undefined;
					return async ({ result, update }) => {
						pending = false;
						if (result.type === 'success' || result.type === 'failure') {
							const data = result.data as CreatePaymentState;
							if (data?.fieldErrors) localFieldErrors = data.fieldErrors;
							if (data?.error) localError = data.error;
							if (data?.success && data.paymentId) {
								onSuccess?.(data.paymentId);
								open = false;
								resetForm();
								await invalidate(OPS_LOAD_DEPS.payments);
								await invalidate(OPS_LOAD_DEPS.dashboard);
							}
						}
						await update({ reset: false, invalidateAll: false });
					};
				}}
			>
				{#key formKey}
					<input type="hidden" name="locale" value={locale} />
					<input type="hidden" name="kind" value={kind} />

					<FormField label={d.payments.member} htmlFor="payment-member-search">
						{#snippet children({ invalid: _invalid, describedBy: _describedBy })}
							<div bind:this={rootEl} class="relative">
								<input type="hidden" name="member_id" value={memberId} required />
								<div class="relative">
									<Search
										class="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
										aria-hidden="true"
									/>
									<input
										bind:this={inputEl}
										id="payment-member-search"
										type="text"
										role="combobox"
										aria-autocomplete="list"
										aria-expanded={showList || showEmpty}
										aria-controls="payment-member-list"
										autocomplete="off"
										spellcheck="false"
										placeholder={d.payments.searchMember}
										bind:value={memberQuery}
										oninput={onMemberQueryInput}
										onfocus={() => (memberListOpen = true)}
										onkeydown={onMemberKeyDown}
										class="h-11 w-full border bg-[var(--color-surface-hover)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] transition-[border-radius,border-color] duration-200 focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] {fe?.member_id
											? 'border-[var(--color-primary)] focus:border-[var(--color-primary)]'
											: 'border-[var(--color-border)] focus:border-[var(--color-ring)]'} {showList ||
										showEmpty
											? 'rounded-t-lg rounded-b-none border-b-transparent focus:border-b-transparent'
											: 'rounded-lg'}"
									/>
									{#if memberQuery || memberId}
										<button
											type="button"
											onclick={clearMember}
											class="absolute right-2 top-1/2 z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
											aria-label={d.payments.cancel}
										>
											<X class="h-3.5 w-3.5" aria-hidden="true" />
										</button>
									{/if}
								</div>

								{#if showList || showEmpty}
									<div
										id="payment-member-list"
										role="listbox"
										aria-label={d.payments.selectMember}
										class="absolute left-0 right-0 top-full z-30 max-h-64 origin-top overflow-auto rounded-b-lg border border-t-0 bg-[var(--color-surface)] shadow-lg {fe?.member_id
											? 'border-[var(--color-primary)]'
											: 'border-[var(--color-border)]'}"
									>
										{#if showEmpty}
											<p class="px-4 py-3 text-sm text-[var(--color-muted)]">
												{d.payments.noMemberMatches}
											</p>
										{:else}
											<ul class="py-1">
												{#if canManageMembers}
													{@const registerActive = safeActiveIndex === 0}
													<li
														id="payment-member-opt-register"
														role="option"
														aria-selected={false}
													>
														<button
															type="button"
															class="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-4 py-2.5 text-left transition-colors {registerActive
																? 'bg-[var(--color-primary-soft)]'
																: 'hover:bg-[var(--color-surface-hover)]'}"
															onmouseenter={() => (activeIndex = 0)}
															onclick={openCreateMember}
														>
															<span
																class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-on)]"
															>
																<UserPlus class="h-4 w-4" aria-hidden="true" />
															</span>
															<span
																class="min-w-0 flex-1 text-sm font-semibold text-[var(--color-primary)]"
															>
																{d.payments.registerNewMember}
															</span>
														</button>
													</li>
												{/if}
												{#each filteredMembers as m, index (m.id)}
													{@const rowIndex = index + registerRowOffset}
													{@const active = rowIndex === safeActiveIndex}
													{@const isSelected = m.id === memberId}
													<li
														id="payment-member-opt-{m.id}"
														role="option"
														aria-selected={isSelected}
													>
														<button
															type="button"
															class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors {active ||
															isSelected
																? 'bg-[var(--color-primary-soft)]'
																: 'hover:bg-[var(--color-surface-hover)]'}"
															onmouseenter={() => (activeIndex = rowIndex)}
															onclick={() => pickMember(m)}
														>
															<span
																class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[10px] font-bold text-[var(--color-primary)]"
															>
																{initials(m.name)}
															</span>
															<span class="min-w-0 flex-1">
																<span class="block truncate text-sm text-[var(--color-text)]">
																	{#each highlightParts(m.name, memberQuery) as part}
																		{#if part.match}
																			<mark
																				class="bg-transparent font-bold text-[var(--color-primary)]"
																			>{part.text}</mark
																			>
																		{:else}
																			{part.text}
																		{/if}
																	{/each}
																</span>
																{#if m.email}
																	<span class="block truncate text-xs text-[var(--color-muted)]">
																		{#each highlightParts(m.email, memberQuery) as part}
																			{#if part.match}
																				<mark
																					class="bg-transparent font-bold text-[var(--color-primary)]"
																				>{part.text}</mark
																				>
																			{:else}
																				{part.text}
																			{/if}
																		{/each}
																	</span>
																{/if}
															</span>
														</button>
													</li>
												{/each}
												{#if showNoMatchesHint}
													<li class="px-4 py-2.5 text-sm text-[var(--color-muted)]" role="presentation">
														{d.payments.noMemberMatches}
													</li>
												{/if}
											</ul>
										{/if}
									</div>
								{/if}

								{#if fe?.member_id}
									<p class="mt-1.5 text-sm font-medium text-[var(--color-primary)]" role="alert">
										{fe.member_id}
									</p>
								{/if}
							</div>
						{/snippet}
					</FormField>

					<div>
						<p id="payment-kind-label" class="mb-2 text-sm font-medium text-[var(--color-text)]">
							{d.payments.kindLabel}
						</p>
						<div
							role="radiogroup"
							aria-labelledby="payment-kind-label"
							class="grid grid-cols-2 gap-2"
						>
							<button
								type="button"
								role="radio"
								aria-checked={kind === 'plan'}
								onclick={() => applyKind('plan')}
								disabled={plans.length === 0}
								class="rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 {kind ===
								'plan'
									? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]'
									: 'border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:border-[var(--color-ring)]'}"
							>
								<span class="block font-semibold text-[var(--color-text)]">{d.payments.kindPlan}</span>
							</button>
							<button
								type="button"
								role="radio"
								aria-checked={kind === 'day_pass'}
								onclick={() => applyKind('day_pass')}
								disabled={dayPassPrice == null}
								title={dayPassPrice == null ? d.payments.dayPassNotConfigured : undefined}
								class="rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 {kind ===
								'day_pass'
									? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]'
									: 'border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:border-[var(--color-ring)]'}"
							>
								<span class="block font-semibold text-[var(--color-text)]"
									>{d.payments.kindDayPass}</span
								>
								<span class="mt-0.5 block text-xs text-[var(--color-muted)]">
									{dayPassPrice != null
										? formatMoney(dayPassPrice)
										: d.payments.dayPassNotConfigured}
								</span>
							</button>
						</div>
					</div>

					{#if kind === 'plan'}
						<FormField
							label={d.payments.selectPlan}
							htmlFor="payment-plan"
							error={fe?.plan_id}
						>
							{#snippet children({ invalid, describedBy })}
								{#if plans.length === 0}
									<p class="text-sm text-[var(--color-muted)]">{d.payments.noActivePlans}</p>
								{:else}
									<Select
										id="payment-plan"
										name="plan_id"
										bind:value={planId}
										required
										{invalid}
										{describedBy}
										onchange={(e) =>
											applyPlan((e.currentTarget as HTMLSelectElement).value)}
									>
										{#each plans as p (p.id)}
											<option value={p.id}>{p.name} — {formatMoney(p.price)}</option>
										{/each}
									</Select>
								{/if}
							{/snippet}
						</FormField>
					{/if}

					<div class="grid items-start gap-4 sm:grid-cols-2">
						<FormField label={d.payments.amount} htmlFor="payment-amount" error={fe?.amount}>
							{#snippet children({ invalid, describedBy })}
								<Input
									id="payment-amount"
									name="amount"
									type="number"
									min={0}
									max={1_000_000}
									step="0.01"
									inputmode="decimal"
									required
									placeholder="0.00"
									bind:value={amount}
									{invalid}
									{describedBy}
								/>
							{/snippet}
						</FormField>
						<FormField label={d.payments.method} htmlFor="payment-method" error={fe?.method}>
							{#snippet children({ invalid, describedBy })}
								<Select
									id="payment-method"
									name="method"
									bind:value={method}
									{invalid}
									{describedBy}
								>
									<option value="cash">{d.payments.cash}</option>
									<option value="transfer">{d.payments.transfer}</option>
								</Select>
							{/snippet}
						</FormField>
					</div>

					<p class="text-xs leading-snug text-[var(--color-muted)]">{d.payments.amountHint}</p>

					{#if localError}
						<p
							class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
							role="alert"
						>
							{localError}
						</p>
					{/if}

					<div class="flex flex-row-reverse flex-wrap items-center gap-3 pt-1">
						<Button
							type="submit"
							class="min-h-11 min-w-[8.5rem] flex-1 sm:flex-none"
							disabled={!canSubmit}
						>
							{pending ? d.payments.submitting : d.payments.submit}
						</Button>
						<Button
							type="button"
							variant="ghost"
							class="min-h-11 min-w-[6rem] flex-1 px-4 py-2.5 sm:flex-none"
							onclick={() => (open = false)}
						>
							{d.payments.cancel}
						</Button>
					</div>
				{/key}
			</form>
		{/if}
	{/if}
</Dialog>

{#if canManageMembers}
	<CreateMemberDialog
		open={createOpen}
		onOpenChange={(next) => (createOpen = next)}
		{locale}
		{d}
		{plans}
		formResult={null}
		action="?/createMember"
		onSuccess={onMemberCreated}
	/>
{/if}
