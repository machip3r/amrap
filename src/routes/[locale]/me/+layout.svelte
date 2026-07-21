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

<div class="amrap-app-shell flex flex-col overflow-hidden bg-[var(--color-bg)]">
	<header
		class="flex h-[calc(4rem+var(--safe-top))] shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--spacing-page)] pt-[var(--safe-top)] sm:gap-3 sm:px-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)]"
	>
		<a href={prefix} class="flex min-h-[var(--touch-target)] items-center gap-2" aria-label="AMRAP">
			<AmrapLogo class="h-9 w-auto" />
			<span class="hidden text-sm font-semibold text-[var(--color-text)] sm:inline">
				{data.d.member.title}
			</span>
		</a>
		<nav class="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto sm:gap-1">
			{#each links as link (link.href)}
				{@const Icon = link.icon}
				<a
					href={link.href}
					class="inline-flex h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors hover:bg-[var(--color-surface-hover)] sm:px-3 {page.url.pathname ===
					link.href
						? 'text-[var(--color-primary)]'
						: 'text-[var(--color-text)]/70 hover:text-[var(--color-text)]'}"
					title={link.label}
					aria-label={link.label}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}
				>
					<Icon class="h-5 w-5 shrink-0" aria-hidden="true" />
					<span class="hidden sm:inline">{link.label}</span>
				</a>
			{/each}
		</nav>
		<div class="flex items-center gap-1 sm:gap-2">
			<ThemeToggle
				label={data.d.a11y.toggleTheme}
				class="h-[var(--touch-target)] w-[var(--touch-target)]"
			/>
			<LogoutButton
				locale={data.locale}
				pendingLabel={data.d.nav.loggingOut}
				class="inline-flex h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] sm:px-3"
				title={data.d.member.logout}
			>
				<LogOut class="h-5 w-5 shrink-0" aria-hidden="true" />
				<span class="hidden sm:inline">{data.d.member.logout}</span>
			</LogoutButton>
			<div
				class="flex h-[var(--touch-target)] w-[var(--touch-target)] items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-sm font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
			>
				{data.initial}
			</div>
		</div>
	</header>
	<main
		class="flex-1 overflow-y-auto px-[var(--spacing-page)] py-[var(--spacing-page)] sm:px-[var(--spacing-page-md)] sm:py-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)] lg:py-[var(--spacing-page-lg)]"
	>
		<div class="w-full">
			{@render children()}
		</div>
	</main>
	<footer
		class="shrink-0 border-t border-[var(--color-border)] py-2 pb-[max(0.5rem,var(--safe-bottom))] text-center text-xs text-[var(--color-muted)]"
	>
		{data.d.shell.poweredBy}
	</footer>
</div>
