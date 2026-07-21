<script lang="ts">
	import { page } from '$app/state';
	import Building2 from '@lucide/svelte/icons/building-2';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LogOut from '@lucide/svelte/icons/log-out';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import OpsNavLogo from '$lib/components/ops/OpsNavLogo.svelte';
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import {
		getSidebarOpsNavItems,
		isOpsNavActive,
		opsNavHref,
		type OpsNavContext
	} from '$lib/nav/ops-nav';
	import { OPS_NAV_ICONS } from '$lib/nav/ops-nav-icons';
	import type { Role } from '$lib/types';
	import { onMount } from 'svelte';

	type Props = {
		locale: Locale;
		role: Role;
		canManageSettings?: boolean;
		canManageStaff?: boolean;
		hiddenNavIds?: readonly string[];
		logoUrlLight?: string | null;
		logoUrlDark?: string | null;
		gymName?: string;
		organizationName?: string;
		isProvisionalOwner?: boolean;
	};

	let {
		locale,
		role,
		canManageSettings = false,
		canManageStaff = false,
		hiddenNavIds = [],
		logoUrlLight = null,
		logoUrlDark = null,
		gymName = undefined,
		organizationName = undefined,
		isProvisionalOwner = false
	}: Props = $props();

	const NAV_COLLAPSED_KEY = 'amrap-nav-collapsed';
	const NAV_COLLAPSED_EVENT = 'amrap-nav-collapsed';

	const d = getDictionary(locale);
	const prefix = `/${locale}`;
	const pathname = $derived(page.url.pathname);
	const ctx = $derived<OpsNavContext>({
		role,
		canManageSettings,
		canManageStaff,
		hiddenNavIds
	});
	const items = $derived(getSidebarOpsNavItems(ctx));
	const orgHref = opsNavHref(prefix, '/organization');

	let collapsed = $state(false);

	onMount(() => {
		try {
			collapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === '1';
		} catch {
			collapsed = false;
		}
		const sync = () => {
			try {
				collapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === '1';
			} catch {
				/* ignore */
			}
		};
		window.addEventListener('storage', sync);
		window.addEventListener(NAV_COLLAPSED_EVENT, sync);
		return () => {
			window.removeEventListener('storage', sync);
			window.removeEventListener(NAV_COLLAPSED_EVENT, sync);
		};
	});

	function toggleCollapsed() {
		const next = !collapsed;
		collapsed = next;
		try {
			localStorage.setItem(NAV_COLLAPSED_KEY, next ? '1' : '0');
		} catch {
			/* ignore */
		}
		window.dispatchEvent(new Event(NAV_COLLAPSED_EVENT));
	}

	function navLinkClass(active: boolean) {
		const layout = collapsed ? 'w-full justify-center px-2 py-2.5' : 'w-full gap-3 px-3 py-2';
		if (active) {
			return `flex items-center rounded-md bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-text)] transition-colors ${layout}`;
		}
		return `flex items-center rounded-md text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] ${layout}`;
	}
</script>

<aside
	class="hidden shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 md:flex {collapsed
		? 'w-[4.5rem]'
		: 'w-64'}"
>
	<div
		class="flex shrink-0 border-b border-[var(--color-border)] {collapsed
			? 'flex-col items-center gap-4 px-2 pb-3 pt-5'
			: 'h-16 items-center justify-between gap-2 px-4'}"
	>
		<div class={collapsed ? 'flex w-full items-center justify-center' : 'min-w-0 flex-1'}>
			<OpsNavLogo
				{logoUrlLight}
				{logoUrlDark}
				{gymName}
				size={collapsed ? 'sm' : 'md'}
			/>
		</div>
		<button
			type="button"
			onclick={toggleCollapsed}
			class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
			aria-label={collapsed ? d.a11y.expandNav : d.a11y.collapseNav}
			aria-expanded={!collapsed}
		>
			{#if collapsed}
				<PanelLeftOpen class="h-5 w-5" aria-hidden="true" />
			{:else}
				<PanelLeftClose class="h-5 w-5" aria-hidden="true" />
			{/if}
		</button>
	</div>

	<nav class="flex-1 space-y-1 py-6 {collapsed ? 'px-2' : 'px-3'}">
		{#each items as item (item.id)}
			{@const href = opsNavHref(prefix, item.path)}
			{@const active = isOpsNavActive(pathname, href)}
			{@const Icon = OPS_NAV_ICONS[item.id]}
			{@const label = item.getLabel(d)}
			<a
				class={navLinkClass(active)}
				{href}
				aria-current={active ? 'page' : undefined}
				title={collapsed ? label : undefined}
			>
				<Icon class="h-5 w-5 shrink-0" aria-hidden="true" />
				<span class={collapsed ? 'sr-only' : undefined}>{label}</span>
			</a>
		{/each}
	</nav>

	<div class="space-y-2 border-t border-[var(--color-border)] py-4 {collapsed ? 'px-2' : 'px-3'}">
		{#if canManageSettings}
			<a
				href={orgHref}
				class={collapsed
					? navLinkClass(isOpsNavActive(pathname, orgHref))
					: `flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-[var(--color-surface-hover)] ${
							isOpsNavActive(pathname, orgHref) ? 'bg-[var(--color-primary-soft)]' : ''
						}`}
				aria-current={isOpsNavActive(pathname, orgHref) ? 'page' : undefined}
				title={collapsed ? organizationName || gymName || d.shell.gymAdmin : undefined}
			>
				{#if collapsed}
					<Building2 class="h-5 w-5 shrink-0" aria-hidden="true" />
				{:else}
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold text-[var(--color-text)]">
							{organizationName || gymName || d.shell.gymAdmin}
						</p>
						<p class="truncate text-xs text-[var(--color-muted)]">
							{gymName && organizationName && gymName !== organizationName
								? gymName
								: d.shell.gymAdmin}
						</p>
						{#if isProvisionalOwner}
							<p class="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
								{d.shell.provisionalOwner}
							</p>
						{/if}
					</div>
					<ChevronRight class="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
				{/if}
			</a>
		{:else if !collapsed}
			<div class="px-3">
				<p class="truncate text-sm font-semibold text-[var(--color-text)]">
					{gymName || d.shell.gymAdmin}
				</p>
				{#if isProvisionalOwner}
					<p class="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
						{d.shell.provisionalOwner}
					</p>
				{/if}
			</div>
		{/if}
		<LogoutButton
			{locale}
			pendingLabel={d.nav.loggingOut}
			class={navLinkClass(false)}
			title={collapsed ? d.nav.logout : undefined}
		>
			<LogOut class="h-5 w-5 shrink-0" aria-hidden="true" />
			<span class={collapsed ? 'sr-only' : undefined}>{d.nav.logout}</span>
		</LogoutButton>
	</div>
</aside>
