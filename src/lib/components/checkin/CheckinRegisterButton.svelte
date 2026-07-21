<script lang="ts">
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import Plus from '@lucide/svelte/icons/plus';
	import UserRound from '@lucide/svelte/icons/user-round';
	import { invalidate } from '$app/navigation';
	import { buttonVariants } from '$lib/components/ui/button-variants';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import RegisterUserDialog, {
		type RegisterPlanOption,
		type RegisterRole
	} from '$lib/components/register/RegisterUserDialog.svelte';
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';

	type Props = {
		locale: Locale;
		canManageMembers: boolean;
		canManageStaff: boolean;
		plans: RegisterPlanOption[];
		label: string;
		class?: string;
	};

	let {
		locale,
		canManageMembers,
		canManageStaff,
		plans,
		label,
		class: className = ''
	}: Props = $props();

	const d = $derived(getDictionary(locale));

	const roles = $derived.by((): RegisterRole[] => {
		const list: RegisterRole[] = [];
		if (canManageMembers) list.push('member');
		if (canManageStaff) {
			list.push('trainer', 'staff');
		}
		return list;
	});

	let pickerOpen = $state(false);
	let registerOpen = $state(false);
	let selectedRole = $state<RegisterRole>('member');

	function openFlow() {
		if (roles.length === 0) return;
		if (roles.length === 1) {
			selectedRole = roles[0]!;
			registerOpen = true;
			return;
		}
		pickerOpen = true;
	}

	function pickRole(role: RegisterRole) {
		selectedRole = role;
		pickerOpen = false;
		registerOpen = true;
	}

	function roleMeta(role: RegisterRole) {
		if (role === 'member') {
			return {
				label: d.registerUser.roleMember,
				hint: d.registerUser.pickMemberHint,
				Icon: UserRound
			};
		}
		if (role === 'trainer') {
			return {
				label: d.registerUser.roleTrainer,
				hint: d.registerUser.pickTrainerHint,
				Icon: Dumbbell
			};
		}
		return {
			label: d.registerUser.roleStaff,
			hint: d.registerUser.pickStaffHint,
			Icon: Briefcase
		};
	}
	const triggerClass = $derived(`${buttonVariants.toolbar} ${className}`.trim());
</script>

{#if roles.length > 0}
	<button type="button" class={triggerClass} onclick={openFlow}>
		<Plus class="h-4 w-4 shrink-0" aria-hidden="true" />
		<span class="shrink-0">{label}</span>
	</button>

	<Dialog
		open={pickerOpen}
		onOpenChange={(open) => (pickerOpen = open)}
		title={d.registerUser.pickTitle}
		description={d.registerUser.pickDescription}
		closeLabel={d.registerUser.close}
		class="max-w-2xl sm:max-w-3xl"
		bodyClass="px-6 py-5 sm:px-8 sm:py-7"
	>
		<div
			class="grid gap-3 {roles.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}"
			role="list"
		>
			{#each roles as role (role)}
				{@const meta = roleMeta(role)}
				<button
					type="button"
					role="listitem"
					onclick={() => pickRole(role)}
					class="flex min-h-28 flex-col items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-left transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
				>
					<span
						class="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
					>
						<meta.Icon class="h-5 w-5" aria-hidden="true" />
					</span>
					<span class="font-title text-lg font-bold text-[var(--color-text)]">{meta.label}</span>
					<span class="text-sm leading-snug text-[var(--color-muted)]">{meta.hint}</span>
				</button>
			{/each}
		</div>
	</Dialog>

	{#key selectedRole}
		<RegisterUserDialog
			{locale}
			open={registerOpen}
			onOpenChange={(open) => (registerOpen = open)}
			defaultRole={selectedRole}
			allowedRoles={[selectedRole]}
			{canManageMembers}
			{canManageStaff}
			{plans}
			memberAction="?/createMember"
			teamAction="?/createTeam"
			navigateOnSuccess={false}
			onSuccess={() => {
				void invalidate(OPS_LOAD_DEPS.checkin);
			}}
		/>
	{/key}
{/if}
