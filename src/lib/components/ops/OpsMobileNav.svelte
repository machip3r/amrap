<script lang="ts">
	import { page } from "$app/state";
	import LogOut from "@lucide/svelte/icons/log-out";
	import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
	import QrCode from "@lucide/svelte/icons/qr-code";
	import AmrapWatermark from "$lib/components/AmrapWatermark.svelte";
	import LogoutButton from "$lib/components/LogoutButton.svelte";
	import QrCodeImage from "$lib/components/QrCodeImage.svelte";
	import Dialog from "$lib/components/ui/Dialog.svelte";
	import IdentityPickerList from "$lib/components/IdentityPickerList.svelte";
	import type { UserIdentity } from "$lib/auth/identities";
	import type { Locale } from "$lib/i18n/config";
	import { getDictionary } from "$lib/i18n/dictionaries";
	import {
		getVisibleOpsNavItems,
		isOpsNavActive,
		opsNavHref,
		splitMobileOpsNav,
		type OpsNavContext,
		type OpsNavItemDef,
	} from "$lib/nav/ops-nav";
	import { OPS_NAV_ICONS } from "$lib/nav/ops-nav-icons";
	import type { Role } from "$lib/types";

	type Props = {
		locale: Locale;
		role: Role;
		canManageSettings?: boolean;
		canManageStaff?: boolean;
		hiddenNavIds?: readonly string[];
		gymName?: string;
		organizationName?: string;
		isProvisionalOwner?: boolean;
		qrCode?: string | null;
		fullName?: string | null;
		showWatermark?: boolean;
		identities?: UserIdentity[];
		activeIdentityId?: string;
	};

	let {
		locale,
		role,
		canManageSettings = false,
		canManageStaff = false,
		hiddenNavIds = [],
		gymName = undefined,
		organizationName = undefined,
		isProvisionalOwner = false,
		qrCode = null,
		fullName = null,
		showWatermark = true,
		identities = [],
		activeIdentityId = "",
	}: Props = $props();

	const d = $derived(getDictionary(locale));
	const prefix = $derived(`/${locale}`);
	const pathname = $derived(page.url.pathname);

	let moreOpen = $state(false);
	let qrOpen = $state(false);

	const ctx = $derived<OpsNavContext>({
		role,
		canManageSettings,
		canManageStaff,
		hiddenNavIds,
	});
	const split = $derived(splitMobileOpsNav(getVisibleOpsNavItems(ctx)));
	const leftTabs = $derived(
		split.primary.slice(0, Math.ceil(split.primary.length / 2)),
	);
	const rightTabs = $derived(split.primary.slice(leftTabs.length));
	const moreActive = $derived(
		split.more.some((item) =>
			isOpsNavActive(pathname, opsNavHref(prefix, item.path)),
		),
	);

	function tabClass(active: boolean) {
		if (active) {
			return "flex min-h-[var(--ops-bottom-nav-height)] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[var(--color-primary)]";
		}
		return "flex min-h-[var(--ops-bottom-nav-height)] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]";
	}

	function moreLinkClass(active: boolean) {
		if (active) {
			return "flex min-h-[var(--touch-target)] items-center gap-3 rounded-lg bg-[var(--color-primary-soft)] px-4 py-3.5 text-base font-semibold text-[var(--color-text)]";
		}
		return "flex min-h-[var(--touch-target)] items-center gap-3 rounded-lg px-4 py-3.5 text-base font-medium text-[var(--color-text)]/80 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]";
	}
</script>

{#snippet tabLink(item: OpsNavItemDef)}
	{@const href = opsNavHref(prefix, item.path)}
	{@const active = isOpsNavActive(pathname, href)}
	{@const Icon = OPS_NAV_ICONS[item.id]}
	{@const label = item.getLabel(d)}
	<a
		{href}
		class={tabClass(active)}
		data-tour="nav-{item.id}"
		aria-current={active ? "page" : undefined}
	>
		<Icon class="h-6 w-6 shrink-0" aria-hidden="true" />
		<span class="max-w-full truncate text-[11px] font-semibold leading-tight"
			>{label}</span
		>
	</a>
{/snippet}

<nav
	class="amrap-bottom-chrome fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden"
	aria-label={d.nav.brandTitle}
>
	<div class="relative flex items-stretch justify-around px-0.5">
		{#each leftTabs as item (item.id)}
			{@render tabLink(item)}
		{/each}

		{#if qrCode}
			<div
				class="relative flex min-w-[4.25rem] flex-1 items-start justify-center"
			>
				<button
					type="button"
					onclick={() => (qrOpen = true)}
					class="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-on)] shadow-lg ring-4 ring-[var(--color-surface)] transition-transform active:scale-95"
					aria-label={d.a11y.showMyQr}
					aria-haspopup="dialog"
					aria-expanded={qrOpen}
				>
					<QrCode class="h-7 w-7" aria-hidden="true" />
				</button>
				<span
					class="mt-10 max-w-full truncate px-0.5 text-center text-[11px] font-semibold leading-tight text-[var(--color-muted)]"
				>
					{d.nav.myQr}
				</span>
			</div>
		{/if}

		{#each rightTabs as item (item.id)}
			{@render tabLink(item)}
		{/each}

		<button
			type="button"
			class={tabClass(moreActive && !moreOpen)}
			onclick={() => (moreOpen = true)}
			aria-label={d.a11y.openMoreNav}
			aria-expanded={moreOpen}
			aria-haspopup="dialog"
		>
			<MoreHorizontal class="h-6 w-6 shrink-0" aria-hidden="true" />
			<span
				class="max-w-full truncate text-[11px] font-semibold leading-tight"
				>{d.nav.more}</span
			>
		</button>
	</div>
	{#if showWatermark}
		<AmrapWatermark
			{locale}
			label={d.shell.poweredBy}
			class="border-[var(--color-border)] bg-[var(--color-surface)] pt-1.5 pb-[max(0.4rem,var(--safe-bottom))]"
		/>
	{:else}
		<div
			class="bg-[var(--color-surface)] pb-[max(0.5rem,var(--safe-bottom))]"
			aria-hidden="true"
		></div>
	{/if}
</nav>

<Dialog
	open={moreOpen}
	onOpenChange={(v) => (moreOpen = v)}
	title={d.nav.more}
	closeLabel={d.a11y.closeMoreNav}
	containerClass="items-end justify-center p-0 sm:items-center sm:p-6"
	class="max-w-none rounded-none rounded-t-2xl border-x-0 border-b-0 sm:max-w-md sm:rounded-2xl sm:border"
	bodyClass="px-2 py-2 pb-[max(0.75rem,var(--safe-bottom))]"
	autoFocus={false}
>
	<div class="space-y-0.5">
		{#if identities.length > 1 && activeIdentityId}
			<IdentityPickerList
				{locale}
				{identities}
				activeId={activeIdentityId}
				labels={d.shell}
				onNavigate={() => (moreOpen = false)}
			/>
		{/if}
		{#if gymName || organizationName}
			<div
				class="mb-2 border-b border-[var(--color-border)] px-4 pb-3 pt-1"
			>
				<p
					class="truncate text-base font-semibold text-[var(--color-text)]"
				>
					{organizationName || gymName}
				</p>
				{#if gymName && organizationName && gymName !== organizationName}
					<p class="truncate text-sm text-[var(--color-muted)]">
						{gymName}
					</p>
				{:else}
					<p class="truncate text-sm text-[var(--color-muted)]">
						{d.shell.gymAdmin}
					</p>
				{/if}
				{#if isProvisionalOwner}
					<p
						class="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]"
					>
						{d.shell.provisionalOwner}
					</p>
				{/if}
			</div>
		{/if}
		<a
			href="{prefix}/profile"
			class={moreLinkClass(pathname.includes('/profile'))}
			aria-current={pathname.includes('/profile') ? 'page' : undefined}
			onclick={() => (moreOpen = false)}
		>
			<span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-[10px] font-bold text-[var(--color-primary)]"
				>{(fullName ?? '?').charAt(0).toUpperCase()}</span
			>
			<span class="min-w-0 truncate">{d.member.profile}</span>
		</a>
		{#each split.more as item (item.id)}
			{@const href = opsNavHref(prefix, item.path)}
			{@const active = isOpsNavActive(pathname, href)}
			{@const Icon = OPS_NAV_ICONS[item.id]}
			{@const label =
				item.id === "organization"
					? organizationName || gymName || d.shell.gymAdmin
					: item.getLabel(d)}
			<a
				{href}
				class={moreLinkClass(active)}
				data-tour="nav-{item.id}"
				aria-current={active ? "page" : undefined}
				onclick={() => (moreOpen = false)}
			>
				<Icon class="h-5 w-5 shrink-0" aria-hidden="true" />
				<span class="min-w-0 truncate">{label}</span>
			</a>
		{/each}
		<LogoutButton
			{locale}
			pendingLabel={d.nav.loggingOut}
			class={moreLinkClass(false)}
			title={d.nav.logout}
		>
			<LogOut class="h-5 w-5 shrink-0" aria-hidden="true" />
			<span>{d.nav.logout}</span>
		</LogoutButton>
	</div>
</Dialog>

{#if qrCode}
	<Dialog
		open={qrOpen}
		onOpenChange={(v) => (qrOpen = v)}
		title={d.nav.myQr}
		description={d.shell.myQrHint}
		closeLabel={d.a11y.closeMyQr}
		fullScreen
		bodyClass="flex h-full min-h-0 flex-col p-0"
		autoFocus={false}
	>
		<div
			class="flex min-h-full w-full flex-col items-center justify-center gap-6 px-6 py-8 pb-[max(2rem,var(--safe-bottom))] text-center"
		>
			{#if fullName}
				<p class="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
					{fullName}
				</p>
			{/if}
			<QrCodeImage
				value={qrCode}
				size={512}
				alt={d.nav.myQr}
				class="h-auto w-[min(88vw,28rem)] max-w-full"
			/>
			<p
				class="hidden max-w-sm break-all font-mono text-base text-[var(--color-muted)] sm:block sm:text-lg"
			>
				{qrCode}
			</p>
		</div>
	</Dialog>
{/if}
