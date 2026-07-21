<script lang="ts">
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import RegisterUserButton from '$lib/components/register/RegisterUserButton.svelte';
	import type { RegisterPlanOption } from '$lib/components/register/RegisterUserDialog.svelte';
	import type { Locale } from '$lib/i18n/config';

	type Props = {
		locale: Locale;
		canCheckIn: boolean;
		canManageMembers: boolean;
		canManageStaff: boolean;
		plans: RegisterPlanOption[];
		labels: {
			quickActions: string;
			quickCheckIn: string;
			quickNewMember: string;
			quickNewTrainer: string;
			quickNewStaff: string;
		};
	};

	let { locale, canCheckIn, canManageMembers, canManageStaff, plans, labels }: Props = $props();

	const prefix = $derived(`/${locale}`);
	const actionClass =
		'inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-base font-semibold text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)] sm:min-h-16 sm:py-4';
</script>

<section aria-label={labels.quickActions} class="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
	{#if canCheckIn}
		<a href="{prefix}/checkin" class={actionClass}>
			<QrCode class="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
			{labels.quickCheckIn}
		</a>
	{/if}
	{#if canManageMembers}
		<RegisterUserButton
			{locale}
			canManageMembers
			canManageStaff={false}
			{plans}
			defaultRole="member"
			allowedRoles={['member']}
			label={labels.quickNewMember}
			appearance="quickAction"
		>
			{#snippet icon()}
				<UserPlus class="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
			{/snippet}
		</RegisterUserButton>
	{/if}
	{#if canManageStaff}
		<RegisterUserButton
			{locale}
			canManageMembers={false}
			canManageStaff
			defaultRole="trainer"
			allowedRoles={['trainer']}
			label={labels.quickNewTrainer}
			appearance="quickAction"
		>
			{#snippet icon()}
				<Dumbbell class="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
			{/snippet}
		</RegisterUserButton>
		<RegisterUserButton
			{locale}
			canManageMembers={false}
			canManageStaff
			defaultRole="staff"
			allowedRoles={['staff']}
			label={labels.quickNewStaff}
			appearance="quickAction"
		>
			{#snippet icon()}
				<Briefcase class="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
			{/snippet}
		</RegisterUserButton>
	{/if}
</section>
