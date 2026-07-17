<script lang="ts">
	import type { Snippet } from 'svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Button from '$lib/components/ui/Button.svelte';
	import RegisterUserDialog, {
		type RegisterPlanOption,
		type RegisterRole,
		type RegisterSuccessPayload
	} from '$lib/components/register/RegisterUserDialog.svelte';
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';

	type Props = {
		locale: Locale;
		canManageMembers: boolean;
		canManageStaff: boolean;
		plans?: RegisterPlanOption[];
		defaultRole?: RegisterRole;
		allowedRoles?: RegisterRole[];
		label?: string;
		class?: string;
		appearance?: 'primary' | 'quickAction';
		memberAction?: string;
		teamAction?: string;
		onSuccess?: (payload: RegisterSuccessPayload) => void;
		icon?: Snippet;
	};

	let {
		locale,
		canManageMembers,
		canManageStaff,
		plans = [],
		defaultRole = undefined,
		allowedRoles = undefined,
		label = undefined,
		class: className = '',
		appearance = 'primary',
		memberAction = '?/createMember',
		teamAction = '?/createTeam',
		onSuccess = undefined,
		icon = undefined
	}: Props = $props();

	const d = $derived(getDictionary(locale));
	let open = $state(false);

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

	const triggerClass = $derived(
		appearance === 'quickAction'
			? `inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)] ${className}`.trim()
			: `inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 shadow-sm transition-[background-color,box-shadow,transform,filter] duration-200 hover:brightness-[0.92] hover:shadow-md active:translate-y-px active:brightness-[0.88] active:shadow-sm ${className}`.trim()
	);
</script>

{#if roles.length > 0}
	{#if appearance === 'quickAction'}
		<button type="button" class={triggerClass} onclick={() => (open = true)}>
			{#if icon}
				{@render icon()}
			{:else}
				<Plus class="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
			{/if}
			{label ?? d.registerUser.open}
		</button>
	{:else}
		<Button type="button" class={triggerClass} onclick={() => (open = true)}>
			{#if icon}
				{@render icon()}
			{:else}
				<Plus class="h-4 w-4" aria-hidden="true" />
			{/if}
			{label ?? d.registerUser.open}
		</Button>
	{/if}

	<RegisterUserDialog
		{locale}
		{open}
		onOpenChange={(v) => (open = v)}
		{defaultRole}
		{allowedRoles}
		{canManageMembers}
		{canManageStaff}
		{plans}
		{memberAction}
		{teamAction}
		{onSuccess}
	/>
{/if}
