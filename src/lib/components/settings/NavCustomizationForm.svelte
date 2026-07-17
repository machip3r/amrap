<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Check from '@lucide/svelte/icons/check';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
	import { OPS_NAV_ICONS } from '$lib/nav/ops-nav-icons';
	import {
		getCustomizableOpsNavItems,
		roleAllowsNavCustomization,
		type OpsNavContext,
		type OpsNavId
	} from '$lib/nav/ops-nav';
	import type { Role } from '$lib/types';
	import type { SettingsActionState } from '$lib/server/settings/actions';

	type Props = {
		locale: Locale;
		d: Dictionary;
		role: Role;
		canManageSettings: boolean;
		canManageStaff: boolean;
		hiddenNavIds: readonly string[];
	};

	let { locale, d, role, canManageSettings, canManageStaff, hiddenNavIds }: Props = $props();

	let hidden = $state(new Set<string>());
	let pending = $state(false);
	let flash = $state<string | undefined>(undefined);
	let error = $state<string | undefined>(undefined);

	$effect(() => {
		hidden = new Set(hiddenNavIds);
	});

	const ctx = $derived<OpsNavContext>({
		role,
		canManageSettings,
		canManageStaff
	});

	const allowed = $derived(roleAllowsNavCustomization(ctx));
	const items = $derived(getCustomizableOpsNavItems(ctx));

	function toggle(id: OpsNavId) {
		const next = new Set(hidden);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		hidden = next;
	}
</script>

{#if allowed}
	<div class="flex flex-col gap-5">
		<div class="flex items-start justify-between gap-4">
			<div class="min-w-0">
				<h2 class="font-title text-2xl font-bold text-[var(--color-text)]">
					{d.settings.customization}
				</h2>
				<p class="mt-1 max-w-xl text-sm text-[var(--color-muted)]">
					{d.settings.customizationHint}
				</p>
			</div>
			{#if flash}
				<p
					class="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-3 py-2 text-sm font-medium text-[var(--color-success)]"
					role="status"
				>
					<Check class="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
					{flash}
				</p>
			{/if}
		</div>

		{#if error}
			<p
				class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
				role="alert"
			>
				{error}
			</p>
		{/if}

		<section
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		>
			<form
				method="POST"
				action="?/saveNav"
				class="flex flex-col gap-4"
				use:enhance={() => {
					pending = true;
					flash = undefined;
					error = undefined;
					return async ({ result, update }) => {
						pending = false;
						await update({ invalidateAll: false });
						if (result.type === 'success') {
							const data = result.data as SettingsActionState;
							if (data?.success) {
								flash = data.success;
								await invalidate(OPS_LOAD_DEPS.workspace);
							}
							if (data?.error) error = data.error;
						}
					};
				}}
			>
				<input type="hidden" name="locale" value={locale} />
				{#each items as item (item.id)}
					{#if hidden.has(item.id)}
						<input type="hidden" name="hidden" value={item.id} />
					{/if}
				{/each}

				<ul
					class="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
				>
					{#each items as item (item.id)}
						{@const Icon = OPS_NAV_ICONS[item.id]}
						{@const label = item.getLabel(d)}
						{@const shown = !hidden.has(item.id)}
						<li class="flex min-h-14 items-center gap-3 px-4 py-3">
							<Icon class="h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
							<span class="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)]">
								{label}
							</span>
							<button
								type="button"
								role="switch"
								aria-checked={shown}
								aria-label="{label}: {shown ? d.settings.navVisible : d.settings.navHidden}"
								onclick={() => toggle(item.id)}
								class="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] {shown
									? 'bg-[var(--color-primary)]'
									: 'bg-[var(--color-muted)]/35'}"
							>
								<span
									class="inline-block h-6 w-6 rounded-full bg-[var(--color-surface)] shadow transition-transform {shown
										? 'translate-x-7'
										: 'translate-x-1'}"
									aria-hidden="true"
								></span>
							</button>
						</li>
					{/each}
				</ul>

				<div class="flex justify-end">
					<Button type="submit" disabled={pending} class="min-h-11">
						{pending ? d.settings.saving : d.settings.saveNav}
					</Button>
				</div>
			</form>
		</section>
	</div>
{/if}
