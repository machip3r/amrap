<script lang="ts">
	import { page } from '$app/state';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Home from '@lucide/svelte/icons/home';
	import Inbox from '@lucide/svelte/icons/inbox';
	import LogOut from '@lucide/svelte/icons/log-out';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import Timer from '@lucide/svelte/icons/timer';
	import User from '@lucide/svelte/icons/user';
	import AmrapWatermark from '$lib/components/AmrapWatermark.svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import QrCodeImage from '$lib/components/QrCodeImage.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import IdentityPickerList from '$lib/components/IdentityPickerList.svelte';
	import type { UserIdentity } from '$lib/auth/identities';
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import {
		isMemberNavActive,
		memberNavHref,
		splitMobileMemberNav,
		type MemberNavId,
		type MemberNavItemDef
	} from '$lib/nav/member-nav';
	import type { Component } from 'svelte';

	type Props = {
		locale: Locale;
		gymName?: string;
		qrCode?: string | null;
		fullName?: string | null;
		showWatermark?: boolean;
		profileHref: string;
		identities?: UserIdentity[];
		activeIdentityId?: string;
	};

	let {
		locale,
		gymName = undefined,
		qrCode = null,
		fullName = null,
		showWatermark = true,
		profileHref,
		identities = [],
		activeIdentityId = ''
	}: Props = $props();

	const d = $derived(getDictionary(locale));
	const prefix = `/${locale}/me`;
	const pathname = $derived(page.url.pathname);

	let moreOpen = $state(false);
	let qrOpen = $state(false);

	const split = splitMobileMemberNav();
	const leftTabs = split.primary.slice(0, Math.ceil(split.primary.length / 2));
	const rightTabs = split.primary.slice(leftTabs.length);
	const moreActive = $derived(
		split.more.some((item) => isMemberNavActive(pathname, memberNavHref(prefix, item.path))) ||
			isMemberNavActive(pathname, profileHref)
	);

	const ICONS: Record<MemberNavId, Component> = {
		home: Home,
		classes: CalendarDays,
		timers: Timer,
		inbox: Inbox,
		profile: User
	};

	function tabClass(active: boolean) {
		if (active) {
			return 'flex min-h-[var(--ops-bottom-nav-height)] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[var(--color-primary)]';
		}
		return 'flex min-h-[var(--ops-bottom-nav-height)] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]';
	}

	function moreLinkClass(active: boolean) {
		if (active) {
			return 'flex min-h-[var(--touch-target)] items-center gap-3 rounded-lg bg-[var(--color-primary-soft)] px-4 py-3.5 text-base font-semibold text-[var(--color-text)]';
		}
		return 'flex min-h-[var(--touch-target)] items-center gap-3 rounded-lg px-4 py-3.5 text-base font-medium text-[var(--color-text)]/80 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]';
	}
</script>

{#snippet tabLink(item: MemberNavItemDef)}
	{@const href = memberNavHref(prefix, item.path)}
	{@const active = isMemberNavActive(pathname, href)}
	{@const Icon = ICONS[item.id]}
	{@const label = item.getLabel(d)}
	<a {href} class={tabClass(active)} aria-current={active ? 'page' : undefined}>
		<Icon class="h-6 w-6 shrink-0" aria-hidden="true" />
		<span class="max-w-full truncate text-[11px] font-semibold leading-tight">{label}</span>
	</a>
{/snippet}

<nav
	class="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden"
	aria-label={d.member.title}
>
	<div class="relative flex items-stretch justify-around px-0.5">
		{#each leftTabs as item (item.id)}
			{@render tabLink(item)}
		{/each}

		{#if qrCode}
			<div class="relative flex min-w-[4.25rem] flex-1 items-start justify-center">
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
			<span class="max-w-full truncate text-[11px] font-semibold leading-tight">{d.nav.more}</span>
		</button>
	</div>
	{#if showWatermark}
		<AmrapWatermark
			{locale}
			label={d.shell.poweredBy}
			class="border-[var(--color-border)] bg-[var(--color-surface)] !py-0 pt-1 pb-[max(0.25rem,var(--safe-bottom))]"
		/>
	{:else}
		<div
			class="bg-[var(--color-surface)] pb-[max(0.25rem,var(--safe-bottom))]"
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
		{#if gymName}
			<div class="mb-2 border-b border-[var(--color-border)] px-4 pb-3 pt-1">
				<p class="truncate text-base font-semibold text-[var(--color-text)]">{gymName}</p>
				<p class="truncate text-sm text-[var(--color-muted)]">{d.member.title}</p>
			</div>
		{/if}
		<a
			href={profileHref}
			class={moreLinkClass(isMemberNavActive(pathname, profileHref))}
			aria-current={isMemberNavActive(pathname, profileHref) ? 'page' : undefined}
			onclick={() => (moreOpen = false)}
		>
			<User class="h-5 w-5 shrink-0" aria-hidden="true" />
			{d.member.profile}
		</a>
		{#each split.more.filter((i) => i.id !== 'profile') as item (item.id)}
			{@const href = memberNavHref(prefix, item.path)}
			{@const active = isMemberNavActive(pathname, href)}
			{@const Icon = ICONS[item.id]}
			<a
				{href}
				class={moreLinkClass(active)}
				aria-current={active ? 'page' : undefined}
				onclick={() => (moreOpen = false)}
			>
				<Icon class="h-5 w-5 shrink-0" aria-hidden="true" />
				{item.getLabel(d)}
			</a>
		{/each}
		<div class="border-t border-[var(--color-border)] pt-2">
			<LogoutButton
				{locale}
				pendingLabel={d.nav.loggingOut}
				class={moreLinkClass(false)}
				title={d.member.logout}
			>
				<LogOut class="h-5 w-5 shrink-0" aria-hidden="true" />
				{d.member.logout}
			</LogoutButton>
		</div>
	</div>
</Dialog>

{#if qrCode}
	<Dialog
		open={qrOpen}
		onOpenChange={(v) => (qrOpen = v)}
		title={d.nav.myQr}
		closeLabel={d.a11y.closeMyQr}
		fullScreen
		bodyClass="flex flex-col items-center justify-center gap-6 px-6 py-8 pb-[max(2rem,var(--safe-bottom))] text-center"
		autoFocus={false}
	>
		{#if fullName}
			<p class="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">{fullName}</p>
		{/if}
		<QrCodeImage
			value={qrCode}
			size={512}
			alt={d.nav.myQr}
			class="h-auto w-[min(88vw,28rem)] max-w-full"
		/>
	</Dialog>
{/if}
