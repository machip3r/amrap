<script lang="ts">
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Home from '@lucide/svelte/icons/home';
	import Inbox from '@lucide/svelte/icons/inbox';
	import LogOut from '@lucide/svelte/icons/log-out';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import Timer from '@lucide/svelte/icons/timer';
	import AmrapLogo from '$lib/components/landing/AmrapLogo.svelte';
	import ThemeToggle from '$lib/components/landing/ThemeToggle.svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	type Props = {
		data: {
			locale: import('$lib/i18n/config').Locale;
			d: import('$lib/i18n/dictionaries').Dictionary;
			initial: string;
		};
		children: Snippet;
	};

	let { data, children }: Props = $props();

	const prefix = $derived(`/${data.locale}/me`);
	const links = $derived([
		{ href: prefix, label: data.d.member.home, icon: Home },
		{ href: `${prefix}/classes`, label: data.d.member.classes, icon: CalendarDays },
		{ href: `${prefix}/timers`, label: data.d.member.timers, icon: Timer },
		{ href: `${prefix}/inbox`, label: data.d.member.inbox, icon: Inbox },
		{ href: `${prefix}/qr`, label: data.d.member.qr, icon: QrCode }
	]);
</script>

<div class="flex h-screen flex-col overflow-hidden bg-[var(--color-bg)]">
	<header
		class="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6"
	>
		<a href={prefix} class="flex items-center gap-2" aria-label="AMRAP">
			<AmrapLogo class="h-7 w-auto" />
			<span class="hidden text-sm font-semibold text-[var(--color-text)] sm:inline">
				{data.d.member.title}
			</span>
		</a>
		<nav class="flex items-center gap-1 sm:gap-2">
			{#each links as link (link.href)}
				{@const Icon = link.icon}
				<a
					href={link.href}
					class="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface-hover)] sm:px-3 {page.url.pathname ===
					link.href
						? 'text-[var(--color-primary)]'
						: 'text-[var(--color-text)]/70 hover:text-[var(--color-text)]'}"
					title={link.label}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}
				>
					<Icon class="h-4 w-4 shrink-0" aria-hidden="true" />
					<span class="hidden sm:inline">{link.label}</span>
				</a>
			{/each}
		</nav>
		<div class="flex items-center gap-2">
			<ThemeToggle label={data.d.a11y.toggleTheme} />
			<LogoutButton
				locale={data.locale}
				class="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
				title={data.d.member.logout}
			>
				<LogOut class="h-4 w-4 shrink-0" aria-hidden="true" />
				<span class="hidden sm:inline">{data.d.member.logout}</span>
			</LogoutButton>
			<div
				class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
			>
				{data.initial}
			</div>
		</div>
	</header>
	<main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
		<div class="mx-auto w-full max-w-3xl">
			{@render children()}
		</div>
	</main>
	<footer class="shrink-0 border-t border-[var(--color-border)] py-2 text-center text-xs text-[var(--color-muted)]">
		{data.d.shell.poweredBy}
	</footer>
</div>
