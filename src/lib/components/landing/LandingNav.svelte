<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { Menu, X } from '@lucide/svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { LandingDictionary, LandingSectionId } from '$lib/i18n/landing-dictionaries';
	import { sectionIdForNav } from '$lib/i18n/landing-dictionaries';
	import { uiFly } from '$lib/motion';
	import AmrapLogo from './AmrapLogo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	type NavKey = 'home' | 'product' | 'pricing' | 'faq' | 'contact';

	const navItems: { key: NavKey; section: LandingSectionId }[] = [
		{ key: 'home', section: sectionIdForNav('home') },
		{ key: 'product', section: sectionIdForNav('product') },
		{ key: 'pricing', section: sectionIdForNav('pricing') },
		{ key: 'faq', section: sectionIdForNav('faq') },
		{ key: 'contact', section: sectionIdForNav('contact') }
	];

	type Props = {
		locale: Locale;
		d: LandingDictionary;
		labels: Record<NavKey, string>;
	};

	let { locale, d, labels }: Props = $props();

	let active = $state<LandingSectionId>('start');
	let scrolled = $state(false);
	let menuOpen = $state(false);
	const menuId = 'landing-nav-menu';

	const prefix = $derived(`/${locale}`);
	const menuLabel = $derived(menuOpen ? d.nav.closeMenu : d.nav.openMenu);

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 24;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });

		const sections = navItems
			.map((n) => document.getElementById(n.section))
			.filter((el): el is HTMLElement => el != null);

		if (sections.length === 0) {
			return () => window.removeEventListener('scroll', onScroll);
		}

		const lastId = sections[sections.length - 1]!.id as LandingSectionId;

		function updateActive() {
			const scrollBottom = window.scrollY + window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			if (scrollBottom >= docHeight - 120) {
				active = lastId;
				return;
			}

			const marker = window.innerHeight * 0.32;
			let current: LandingSectionId = sections[0]!.id as LandingSectionId;

			for (const el of sections) {
				if (el.getBoundingClientRect().top <= marker) {
					current = el.id as LandingSectionId;
				}
			}

			active = current;
		}

		updateActive();
		window.addEventListener('scroll', updateActive, { passive: true });
		window.addEventListener('resize', updateActive);

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('scroll', updateActive);
			window.removeEventListener('resize', updateActive);
		};
	});

	$effect(() => {
		if (!menuOpen) return;

		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') menuOpen = false;
		}

		function onResize() {
			if (window.matchMedia('(min-width: 1024px)').matches) {
				menuOpen = false;
			}
		}

		document.addEventListener('keydown', onKey);
		window.addEventListener('resize', onResize);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener('keydown', onKey);
			window.removeEventListener('resize', onResize);
			document.body.style.overflow = prevOverflow;
		};
	});

	function scrollTo(id: string) {
		active = id as LandingSectionId;
		menuOpen = false;
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}

	function scrollHome(e: MouseEvent) {
		e.preventDefault();
		menuOpen = false;
		active = 'start';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<header
	class="landing-nav fixed z-50 {scrolled ? 'landing-nav--scrolled' : 'landing-nav--top'} {menuOpen
		? 'landing-nav--menu-open'
		: ''}"
>
	<div class="landing-nav-bar">
		<a href="{prefix}#start" class="landing-nav-brand" onclick={scrollHome}>
			<AmrapLogo class="landing-nav-logo w-auto" />
		</a>

		<nav class="landing-nav-desktop" aria-label={d.nav.mainAria}>
			{#each navItems as { key, section }}
				<button
					type="button"
					onclick={() => scrollTo(section)}
					class="landing-nav-pill {active === section ? 'landing-nav-pill--active' : ''}"
				>
					{labels[key]}
				</button>
			{/each}
		</nav>

		<div class="landing-nav-actions">
			<a href="{prefix}/login" class="landing-nav-login" onclick={() => (menuOpen = false)}>
				{d.nav.login}
			</a>
			<a href="{prefix}/register" class="landing-nav-start" onclick={() => (menuOpen = false)}>
				{d.nav.start}
			</a>
			<button
				type="button"
				class="landing-nav-burger"
				aria-expanded={menuOpen}
				aria-controls={menuId}
				aria-label={menuLabel}
				onclick={() => (menuOpen = !menuOpen)}
			>
				{#if menuOpen}
					<X class="h-5 w-5" aria-hidden="true" />
				{:else}
					<Menu class="h-5 w-5" aria-hidden="true" />
				{/if}
			</button>
		</div>
	</div>

	{#if menuOpen}
		<div id={menuId} class="landing-nav-sheet" transition:fly={uiFly(240, -10)}>
			<nav class="landing-nav-sheet-nav" aria-label={d.nav.mainAria}>
				{#each navItems as { key, section }, i}
					<button
						type="button"
						onclick={() => scrollTo(section)}
						class="landing-nav-sheet-link {active === section
							? 'landing-nav-sheet-link--active'
							: ''}"
						style="animation-delay: {0.04 + i * 0.04}s"
					>
						{labels[key]}
					</button>
				{/each}
				<a href="{prefix}/register" class="landing-nav-sheet-cta" onclick={() => (menuOpen = false)}>
					{d.nav.start}
				</a>
			</nav>
		</div>
	{/if}
</header>

<div class="landing-theme-fab-wrap">
	<ThemeToggle label={d.nav.toggleTheme} class="landing-theme-fab-btn" />
</div>
