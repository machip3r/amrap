<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { UserIdentity } from '$lib/auth/identities';
	import { portal } from '$lib/dom/portal';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';

	type Props = {
		locale: Locale;
		identities: UserIdentity[];
		activeId: string;
		labels: Dictionary['shell'];
		/** Compact trigger for tight headers. */
		compact?: boolean;
		class?: string;
	};

	let {
		locale,
		identities,
		activeId,
		labels,
		compact = false,
		class: className = ''
	}: Props = $props();

	let open = $state(false);
	let rootEl: HTMLDivElement | undefined = $state();
	let menuStyle = $state('');
	const prefix = $derived(`/${locale}`);
	const active = $derived(identities.find((i) => i.id === activeId) ?? identities[0]);
	const showPicker = $derived(identities.length > 1);

	function roleLabel(identity: UserIdentity): string {
		if (identity.role === 'OWNER') {
			return identity.isProvisionalOwner ? labels.provisionalOwner : labels.roleOwner;
		}
		if (identity.role === 'STAFF') return labels.roleStaff;
		if (identity.role === 'TRAINER') return labels.roleTrainer;
		return labels.roleMember;
	}

	function identityTitle(identity: UserIdentity): string {
		return `${roleLabel(identity)} · ${identity.gymName}`;
	}

	function close() {
		open = false;
	}

	function positionMenu() {
		if (!rootEl) return;
		const rect = rootEl.getBoundingClientRect();
		const width = Math.min(18 * 16, window.innerWidth - 16);
		let left = rect.right - width;
		if (left < 8) left = 8;
		menuStyle = `top:${Math.round(rect.bottom + 4)}px;left:${Math.round(left)}px;width:${Math.round(width)}px;`;
	}

	function openMenu() {
		positionMenu();
		open = true;
	}

	function toggle() {
		if (open) close();
		else openMenu();
	}

	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};
		const onDocDown = (e: MouseEvent) => {
			const t = e.target;
			if (!(t instanceof Node)) return;
			if (rootEl?.contains(t)) return;
			if (t instanceof Element && t.closest('[data-identity-menu]')) return;
			close();
		};
		const onReposition = () => positionMenu();
		window.addEventListener('keydown', onKey);
		window.addEventListener('resize', onReposition);
		window.addEventListener('scroll', onReposition, true);
		const timer = window.setTimeout(() => {
			document.addEventListener('mousedown', onDocDown);
		}, 100);
		return () => {
			window.clearTimeout(timer);
			document.removeEventListener('mousedown', onDocDown);
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('resize', onReposition);
			window.removeEventListener('scroll', onReposition, true);
		};
	});
</script>

{#if showPicker && active}
	<div bind:this={rootEl} class="relative z-50 shrink-0 {className}">
		<button
			type="button"
			class="inline-flex max-w-full min-h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-left text-xs font-semibold text-[var(--color-text)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] sm:min-h-10 sm:gap-1.5 sm:px-3 sm:text-sm"
			aria-haspopup="listbox"
			aria-expanded={open}
			aria-label={labels.identityPicker}
			onclick={toggle}
		>
			<span class="min-w-0 truncate">
				{#if compact}
					{roleLabel(active)}
				{:else}
					{identityTitle(active)}
				{/if}
			</span>
			<ChevronDown class="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
		</button>
	</div>

	{#if open}
		<!-- Portaled so overflow:hidden shells cannot clip the menu. -->
		<ul
			use:portal
			data-identity-menu
			class="fixed z-[80] max-h-72 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
			style={menuStyle}
			role="listbox"
			aria-label={labels.identityPicker}
		>
			{#each identities as identity (identity.id)}
				{@const selected = identity.id === active.id}
				<li role="option" aria-selected={selected}>
					<a
						href="{prefix}/context?kind={identity.kind}&gymId={identity.gymId}"
						class="flex flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-hover)] {selected
							? 'bg-[var(--color-primary-soft)]'
							: ''}"
						aria-current={selected ? 'true' : undefined}
						data-sveltekit-preload-data="off"
						onclick={close}
					>
						<span class="truncate text-sm font-semibold text-[var(--color-text)]">
							{roleLabel(identity)}
						</span>
						<span class="truncate text-xs text-[var(--color-muted)]">{identity.gymName}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
{/if}
