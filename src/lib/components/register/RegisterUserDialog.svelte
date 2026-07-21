<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Users from '@lucide/svelte/icons/users';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import type { CreateMemberState } from '$lib/server/members/actions';
	import type { CreateTeamMemberState } from '$lib/server/team/actions';
	import {
		LIMITS,
		sanitizeEmailInput,
		sanitizePersonNameInput,
		sanitizePhoneInput
	} from '$lib/validation/schemas';

	export type RegisterRole = 'member' | 'trainer' | 'staff';

	export type RegisterPlanOption = {
		id: string;
		name: string;
		price: number;
		duration_days: number;
	};

	export type RegisterSuccessPayload = {
		memberId?: string;
		teamMemberId?: string;
		role: RegisterRole;
	};

	type Props = {
		locale: Locale;
		open: boolean;
		onOpenChange: (open: boolean) => void;
		defaultRole?: RegisterRole;
		allowedRoles?: RegisterRole[];
		canManageMembers: boolean;
		canManageStaff: boolean;
		plans?: RegisterPlanOption[];
		/** Form action for member create (default dashboard). */
		memberAction?: string;
		/** Form action for trainer/staff create. */
		teamAction?: string;
		onSuccess?: (payload: RegisterSuccessPayload) => void;
		/** When false, stay on the current page after create (default true). */
		navigateOnSuccess?: boolean;
	};

	let {
		locale,
		open,
		onOpenChange,
		defaultRole = 'member',
		allowedRoles = undefined,
		canManageMembers,
		canManageStaff,
		plans = [],
		memberAction = '?/createMember',
		teamAction = '?/createTeam',
		onSuccess,
		navigateOnSuccess = true
	}: Props = $props();

	const d = $derived(getDictionary(locale));

	function rolesForPermissions(): RegisterRole[] {
		const base: RegisterRole[] = [];
		if (canManageMembers) base.push('member');
		if (canManageStaff) {
			base.push('trainer', 'staff');
		}
		if (!allowedRoles) return base;
		return base.filter((r) => allowedRoles.includes(r));
	}

	const roles = $derived(rolesForPermissions());
	const initialRole = $derived(
		roles.includes(defaultRole) ? defaultRole : (roles[0] ?? 'member')
	);

	let session = $state(0);
	let wasOpen = $state(false);
	let role = $state<RegisterRole>('member');
	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let selectedPlan = $state('');
	let method = $state<'cash' | 'transfer'>('cash');
	let pending = $state(false);
	let formError = $state<string | undefined>(undefined);
	let fieldErrors = $state<Record<string, string> | undefined>(undefined);
	let emailWarning = $state<string | undefined>(undefined);

	$effect(() => {
		if (open && !wasOpen) {
			session += 1;
			role = initialRole;
			resetFields();
		}
		wasOpen = open;
	});

	const isMember = $derived(role === 'member');
	const canSubmit = $derived(
		isMember
			? name.trim().length > 0 &&
					email.trim().length > 0 &&
					selectedPlan.length > 0 &&
					plans.length > 0 &&
					!pending
			: name.trim().length > 0 && email.trim().length > 0 && !pending
	);

	function resetFields() {
		name = '';
		phone = '';
		email = '';
		selectedPlan = plans[0]?.id ?? '';
		method = 'cash';
		pending = false;
		formError = undefined;
		fieldErrors = undefined;
		emailWarning = undefined;
	}

	function roleLabel(r: RegisterRole) {
		if (r === 'member') return d.registerUser.roleMember;
		if (r === 'trainer') return d.registerUser.roleTrainer;
		return d.registerUser.roleStaff;
	}

	function formatPlanLabel(plan: RegisterPlanOption) {
		const price = typeof plan.price === 'number' ? plan.price.toFixed(2) : String(plan.price);
		const meta = d.registerUser.planPrice
			.replace('{days}', String(plan.duration_days))
			.replace('{price}', price);
		return `${plan.name} — ${meta}`;
	}

	function handleMemberResult(data: CreateMemberState) {
		if (!data) return;
		if (data.fieldErrors) fieldErrors = data.fieldErrors;
		if (data.error) formError = data.error;
		if (data.emailWarning) emailWarning = data.emailWarning;
		if (data.success) {
			onSuccess?.({ role: 'member', memberId: data.memberId });
			onOpenChange(false);
			if (navigateOnSuccess && data.memberId) {
				void goto(`/${locale}/members/${data.memberId}`);
			}
		}
	}

	function handleTeamResult(data: CreateTeamMemberState) {
		if (!data) return;
		if (data.fieldErrors) fieldErrors = data.fieldErrors;
		if (data.error) formError = data.error;
		if (data.emailWarning) emailWarning = data.emailWarning;
		if (data.success) {
			const r = (data.role ?? role) as RegisterRole;
			onSuccess?.({ role: r, teamMemberId: data.teamMemberId });
			onOpenChange(false);
			if (navigateOnSuccess && data.teamMemberId) {
				const path = r === 'trainer' ? 'trainers' : 'staff';
				void goto(`/${locale}/${path}/${data.teamMemberId}`);
			}
		}
	}
</script>

<Dialog
	{open}
	{onOpenChange}
	title={d.registerUser.title}
	description={d.registerUser.description}
	closeLabel={d.registerUser.close}
	class="max-w-2xl sm:max-w-3xl lg:max-w-4xl"
	bodyClass="px-6 py-5 sm:px-8 sm:py-7"
>
	{#if roles.length === 0}
		<p class="text-sm text-[var(--color-muted)]">{d.common.forbidden}</p>
	{:else if open}
		{#key session}
			<div class="flex flex-col gap-5 sm:gap-6">
				{#if roles.length > 1}
					<fieldset>
						<legend class="mb-2 text-sm font-medium text-[var(--color-text)]">
							{d.registerUser.roleLabel}
						</legend>
						<div
							role="radiogroup"
							aria-label={d.registerUser.roleLabel}
							class="grid gap-1 rounded-xl bg-[var(--color-surface-hover)] p-1 {roles.length === 2
								? 'grid-cols-2'
								: 'grid-cols-3'}"
						>
							{#each roles as r (r)}
								{@const selected = role === r}
								<label
									class="flex cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold transition-all sm:text-sm {selected
										? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm ring-1 ring-[var(--color-border)]'
										: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
								>
									<input
										type="radio"
										name="register-role"
										value={r}
										checked={selected}
										onchange={() => {
											role = r;
											formError = undefined;
											fieldErrors = undefined;
											emailWarning = undefined;
										}}
										class="sr-only"
									/>
									{#if r === 'member'}
										<UserRound
											class="h-4 w-4 {selected
												? 'text-[var(--color-primary)]'
												: 'text-[var(--color-muted)]'}"
											aria-hidden="true"
										/>
									{:else if r === 'trainer'}
										<Dumbbell
											class="h-4 w-4 {selected
												? 'text-[var(--color-primary)]'
												: 'text-[var(--color-muted)]'}"
											aria-hidden="true"
										/>
									{:else}
										<Users
											class="h-4 w-4 {selected
												? 'text-[var(--color-primary)]'
												: 'text-[var(--color-muted)]'}"
											aria-hidden="true"
										/>
									{/if}
									{roleLabel(r)}
								</label>
							{/each}
						</div>
					</fieldset>
				{/if}

				{#if isMember}
					{#if plans.length === 0}
						<div class="flex flex-col gap-4">
							<p
								class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-3 text-sm text-[var(--color-muted)]"
								role="status"
							>
								{d.registerUser.noPlans}
							</p>
							<button
								type="button"
								onclick={() => onOpenChange(false)}
								class="text-center text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
							>
								{d.registerUser.cancel}
							</button>
						</div>
					{:else}
						<form
							method="POST"
							action={memberAction}
							class="flex flex-col gap-4"
							novalidate
							use:enhance={() => {
								pending = true;
								formError = undefined;
								fieldErrors = undefined;
								emailWarning = undefined;
								return async ({ result }) => {
									pending = false;
									if (result.type === 'success' || result.type === 'failure') {
										handleMemberResult(result.data as CreateMemberState);
									}
								};
							}}
						>
							<input type="hidden" name="locale" value={locale} />
							<div class="grid gap-4 sm:grid-cols-2">
								<FormField label={d.members.name} htmlFor="reg-name" error={fieldErrors?.name}>
									{#snippet children({ invalid, describedBy })}
										<Input
											id="reg-name"
											required
											name="name"
											maxlength={LIMITS.personName}
											autocomplete="name"
											placeholder={d.registerUser.namePlaceholder}
											bind:value={name}
											oninput={(e) => {
												name = sanitizePersonNameInput((e.target as HTMLInputElement).value);
											}}
											{invalid}
											{describedBy}
										/>
									{/snippet}
								</FormField>
								<FormField
									label={d.registerUser.email}
									htmlFor="reg-email"
									error={fieldErrors?.email}
								>
									{#snippet children({ invalid, describedBy })}
										<Input
											id="reg-email"
											required
											type="email"
											name="email"
											maxlength={LIMITS.email}
											autocomplete="email"
											inputmode="email"
											spellcheck={false}
											placeholder={d.registerUser.emailPlaceholder}
											bind:value={email}
											oninput={(e) => {
												email = sanitizeEmailInput((e.target as HTMLInputElement).value);
											}}
											{invalid}
											{describedBy}
										/>
									{/snippet}
								</FormField>
							</div>
							<FormField label={d.members.phone} htmlFor="reg-phone" error={fieldErrors?.phone}>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="reg-phone"
										name="phone"
										placeholder={d.registerUser.phonePlaceholder}
										bind:value={phone}
										oninput={(e) => {
											phone = sanitizePhoneInput((e.target as HTMLInputElement).value);
										}}
										{invalid}
										{describedBy}
									/>
								{/snippet}
							</FormField>
							<div class="grid gap-4 sm:grid-cols-2">
								<FormField
									label={d.members.selectPlan}
									htmlFor="reg-plan"
									error={fieldErrors?.plan_id}
								>
									{#snippet children({ invalid, describedBy })}
										<Select
											id="reg-plan"
											required
											name="plan_id"
											bind:value={selectedPlan}
											{invalid}
											{describedBy}
										>
											{#each plans as p (p.id)}
												<option value={p.id}>{formatPlanLabel(p)}</option>
											{/each}
										</Select>
									{/snippet}
								</FormField>
								<FormField
									label={d.members.paymentMethod}
									htmlFor="reg-method"
									error={fieldErrors?.method}
								>
									{#snippet children({ invalid, describedBy })}
										<Select id="reg-method" name="method" bind:value={method} {invalid} {describedBy}>
											<option value="cash">{d.members.cash}</option>
											<option value="transfer">{d.members.transfer}</option>
										</Select>
									{/snippet}
								</FormField>
							</div>
							{#if formError}
								<p
									class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
									role="alert"
								>
									{formError}
								</p>
							{/if}
							{#if emailWarning}
								<p
									class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-3 text-sm text-[var(--color-muted)]"
									role="status"
								>
									{emailWarning}
								</p>
							{/if}
							<div class="flex w-full gap-2 pt-1">
								<Button
									type="button"
									variant="ghost"
									class="min-h-11 min-w-0 flex-1 border border-[var(--color-border)] px-3"
									onclick={() => onOpenChange(false)}
								>
									{d.registerUser.cancel}
								</Button>
								<Button type="submit" class="min-h-11 min-w-0 flex-1" disabled={!canSubmit}>
									{pending ? d.registerUser.submitting : d.registerUser.submit}
								</Button>
							</div>
						</form>
					{/if}
				{:else}
					<form
						method="POST"
						action={teamAction}
						class="flex flex-col gap-4"
						novalidate
						use:enhance={() => {
							pending = true;
							formError = undefined;
							fieldErrors = undefined;
							emailWarning = undefined;
							return async ({ result }) => {
								pending = false;
								if (result.type === 'success' || result.type === 'failure') {
									handleTeamResult(result.data as CreateTeamMemberState);
								}
							};
						}}
					>
						<input type="hidden" name="locale" value={locale} />
						<input type="hidden" name="role" value={role} />
						<div class="grid gap-4 sm:grid-cols-2">
							<FormField label={d.members.name} htmlFor="reg-team-name" error={fieldErrors?.name}>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="reg-team-name"
										required
										name="name"
										maxlength={LIMITS.personName}
										autocomplete="name"
										placeholder={d.registerUser.namePlaceholder}
										bind:value={name}
										oninput={(e) => {
											name = sanitizePersonNameInput((e.target as HTMLInputElement).value);
										}}
										{invalid}
										{describedBy}
									/>
								{/snippet}
							</FormField>
							<FormField
								label={d.registerUser.email}
								htmlFor="reg-team-email"
								error={fieldErrors?.email}
							>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="reg-team-email"
										required
										type="email"
										name="email"
										maxlength={LIMITS.email}
										autocomplete="email"
										inputmode="email"
										spellcheck={false}
										placeholder={d.registerUser.emailPlaceholder}
										bind:value={email}
										oninput={(e) => {
											email = sanitizeEmailInput((e.target as HTMLInputElement).value);
										}}
										{invalid}
										{describedBy}
									/>
								{/snippet}
							</FormField>
						</div>
						<FormField label={d.members.phone} htmlFor="reg-team-phone" error={fieldErrors?.phone}>
							{#snippet children({ invalid, describedBy })}
								<Input
									id="reg-team-phone"
									name="phone"
									placeholder={d.registerUser.phonePlaceholder}
									bind:value={phone}
									oninput={(e) => {
										phone = sanitizePhoneInput((e.target as HTMLInputElement).value);
									}}
									{invalid}
									{describedBy}
								/>
							{/snippet}
						</FormField>
						{#if formError}
							<p
								class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
								role="alert"
							>
								{formError}
							</p>
						{/if}
						{#if emailWarning}
							<p
								class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-3 text-sm text-[var(--color-muted)]"
								role="status"
							>
								{emailWarning}
							</p>
						{/if}
						<div class="flex w-full gap-2 pt-1">
							<Button
								type="button"
								variant="ghost"
								class="min-h-11 min-w-0 flex-1 border border-[var(--color-border)] px-3"
								onclick={() => onOpenChange(false)}
							>
								{d.registerUser.cancel}
							</Button>
							<Button type="submit" class="min-h-11 min-w-0 flex-1" disabled={!canSubmit}>
								{pending ? d.registerUser.submitting : d.registerUser.submit}
							</Button>
						</div>
					</form>
				{/if}
			</div>
		{/key}
	{/if}
</Dialog>
