<script lang="ts">
	import type { UserIdentity } from '$lib/auth/identities';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';

	type Props = {
		locale: Locale;
		identities: UserIdentity[];
		activeId: string;
		labels: Dictionary['shell'];
		onNavigate?: () => void;
	};

	let { locale, identities, activeId, labels, onNavigate }: Props = $props();

	const prefix = $derived(`/${locale}`);
	const show = $derived(identities.length > 1);

	function roleLabel(identity: UserIdentity): string {
		if (identity.role === 'OWNER') {
			return identity.isProvisionalOwner ? labels.provisionalOwner : labels.roleOwner;
		}
		if (identity.role === 'STAFF') return labels.roleStaff;
		if (identity.role === 'TRAINER') return labels.roleTrainer;
		return labels.roleMember;
	}
</script>

{#if show}
	<div class="border-b border-[var(--color-border)] px-2 pb-2 pt-1">
		<p class="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
			{labels.identityPicker}
		</p>
		<ul class="space-y-0.5" role="listbox" aria-label={labels.identityPicker}>
			{#each identities as identity (identity.id)}
				{@const selected = identity.id === activeId}
				<li role="option" aria-selected={selected}>
					<a
						href="{prefix}/context?kind={identity.kind}&gymId={identity.gymId}"
						class="flex min-h-[var(--touch-target)] flex-col justify-center rounded-lg px-3 py-2.5 transition-colors {selected
							? 'bg-[var(--color-primary-soft)] text-[var(--color-text)]'
							: 'text-[var(--color-text)]/80 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'}"
						aria-current={selected ? 'true' : undefined}
						data-sveltekit-preload-data="off"
						onclick={() => onNavigate?.()}
					>
						<span class="text-sm font-semibold">{roleLabel(identity)}</span>
						<span class="truncate text-xs text-[var(--color-muted)]">{identity.gymName}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
{/if}
