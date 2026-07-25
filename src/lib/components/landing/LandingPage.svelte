<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Locale } from '$lib/i18n/config';
	import type { LandingDictionary } from '$lib/i18n/landing-dictionaries';
	import { reveal, uiFade } from '$lib/motion';
	import LandingNav from './LandingNav.svelte';
	import LandingContact from './LandingContact.svelte';
	import LandingFaq from './LandingFaq.svelte';

	type Props = {
		locale: Locale;
		d: LandingDictionary;
	};

	let { locale, d }: Props = $props();

	let billing = $state<'monthly' | 'annual'>('monthly');

	const prefix = $derived(`/${locale}`);
	const navLabels = $derived({
		home: d.nav.home,
		product: d.nav.product,
		pricing: d.nav.pricing,
		faq: d.nav.faq,
		contact: d.nav.contact
	});
	const year = new Date().getFullYear();

	function scrollToProcess() {
		document.getElementById('proceso')?.scrollIntoView({ behavior: 'smooth' });
	}

	function scrollToContact(e: MouseEvent) {
		e.preventDefault();
		document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<div class="landing-page min-h-screen bg-(--color-bg) text-(--color-text)">
	<div class="landing-nav-spacer" aria-hidden="true"></div>
	<LandingNav {locale} {d} labels={navLabels} />

	<section id="start" class="landing-hero">
		<div class="landing-hero-bg" aria-hidden="true">
			<img src="/images/hero-gym.png" alt="" class="landing-hero-image" />
			<div class="landing-hero-noise"></div>
			<div class="landing-hero-shade"></div>
		</div>

		<div class="landing-hero-content">
			<div class="landing-hero-copy">
				<div class="landing-hero-brand">
					<img
						src="/amrap-hero-logo-white.png"
						alt={d.hero.brand}
						width="1035"
						height="257"
						class="landing-hero-brand-logo"
					/>
				</div>
				<h1 class="font-title landing-hero-title">{d.hero.title}</h1>
				<p class="landing-hero-subtitle">{d.hero.subtitle}</p>
				<div class="landing-hero-ctas">
					<a href="{prefix}/register" class="landing-hero-primary">{d.hero.primaryCta}</a>
					<button type="button" class="landing-hero-secondary" onclick={scrollToProcess}>
						{d.hero.secondaryCta}
					</button>
				</div>
				<p class="landing-hero-trust">{d.hero.trust}</p>
			</div>
		</div>
	</section>

	<section class="landing-audience" aria-label={d.audience.title} use:reveal>
		<div class="landing-container landing-audience-head">
			<p class="landing-audience-title">{d.audience.title}</p>
		</div>
		<div class="landing-marquee" aria-hidden="true">
			<div class="landing-marquee-track">
				{#each [...d.audience.items, ...d.audience.items] as item}
					<span class="landing-marquee-item">{item}</span>
				{/each}
			</div>
		</div>
		<ul class="landing-audience-sr">
			{#each d.audience.items as item}
				<li>{item}</li>
			{/each}
		</ul>
	</section>

	<section id="producto" class="landing-section" use:reveal>
		<div class="landing-container">
			<p class="landing-eyebrow">{d.difference.eyebrow}</p>
			<h2 class="font-title landing-section-title landing-section-title--left">
				{d.difference.title}
			</h2>
			<p class="landing-section-subtitle landing-section-subtitle--left">
				{d.difference.subtitle}
			</p>
			<div class="landing-diff-grid">
				{#each d.difference.items as item, index}
					<article class="landing-diff-item" use:reveal={{ delay: index * 70 }}>
						<span class="landing-diff-index" aria-hidden="true">
							{String(index + 1).padStart(2, '0')}
						</span>
						<h3 class="font-title landing-diff-title">{item.title}</h3>
						<p class="landing-diff-body">{item.body}</p>
					</article>
				{/each}
			</div>

			<div class="landing-product-block" use:reveal>
				<h2 class="font-title landing-section-title landing-section-title--left">
					{d.product.title}
				</h2>
				<p class="landing-section-subtitle landing-section-subtitle--left">
					{d.product.subtitle}
				</p>
				<div class="landing-features-grid">
					{#each d.product.items as item, index}
						<article class="landing-feature" use:reveal={{ delay: index * 60 }}>
							<h3 class="font-title landing-feature-title">{item.title}</h3>
							<p class="landing-feature-body">{item.body}</p>
						</article>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section id="proceso" class="landing-section landing-section--muted landing-process" use:reveal>
		<div class="landing-container">
			<p class="landing-eyebrow">{d.process.eyebrow}</p>
			<h2 class="font-title landing-section-title">{d.process.title}</h2>
			<p class="landing-section-subtitle">{d.process.subtitle}</p>
			<ol class="landing-steps">
				{#each d.process.steps as step, index}
					<li class="landing-step" use:reveal={{ delay: index * 80 }}>
						<span class="landing-step-num font-title" aria-hidden="true">{step.step}</span>
						<h3 class="font-title landing-step-title">{step.title}</h3>
						<p class="landing-step-body">{step.body}</p>
					</li>
				{/each}
			</ol>
			<div class="landing-process-cta" use:reveal={{ delay: 120 }}>
				<a href="{prefix}/register" class="landing-hero-primary">{d.process.cta}</a>
			</div>
		</div>
	</section>

	<section id="precios" class="landing-section" use:reveal>
		<div class="landing-container">
			<h2 class="font-title landing-section-title">{d.pricing.title}</h2>
			<p class="landing-pricing-subtitle">{d.pricing.subtitle}</p>

			<div
				class="landing-billing-toggle"
				role="group"
				aria-label="{d.pricing.monthly} / {d.pricing.annual}"
			>
				<button
					type="button"
					class="landing-billing-btn {billing === 'monthly' ? 'landing-billing-btn--active' : ''}"
					aria-pressed={billing === 'monthly'}
					onclick={() => (billing = 'monthly')}
				>
					{d.pricing.monthly}
				</button>
				<button
					type="button"
					class="landing-billing-btn {billing === 'annual' ? 'landing-billing-btn--active' : ''}"
					aria-pressed={billing === 'annual'}
					onclick={() => (billing = 'annual')}
				>
					{d.pricing.annual}
					<span class="landing-billing-save">{d.pricing.annualSave}</span>
				</button>
			</div>

			<div class="landing-pricing-grid">
				{#each d.pricing.plans as plan, index}
					{@const price = billing === 'annual' ? plan.priceAnnual : plan.priceMonthly}
					{@const period = billing === 'annual' ? plan.periodAnnual : plan.periodMonthly}
					<article
						class="landing-price-card {plan.highlighted ? 'landing-price-card--featured' : ''}"
						use:reveal={{ delay: index * 70 }}
					>
						{#if plan.badge}
							<span class="landing-price-badge">{plan.badge}</span>
						{/if}
						<h3 class="font-title landing-price-name">{plan.name}</h3>
						<p class="landing-price-amount">
							{#key `${plan.name}-${billing}`}
								<span class="font-title landing-price-value" in:fade={uiFade(160)}>
									{price}
								</span>
							{/key}
							{#if period}
								<span class="landing-price-period">{period}</span>
							{/if}
						</p>
						<p class="landing-price-note">{plan.note}</p>
						<ul class="landing-price-features">
							{#each plan.features as feature}
								<li>
									<span class="landing-check" aria-hidden="true">✓</span>
									{feature}
								</li>
							{/each}
						</ul>
						{#if plan.cta === 'contact'}
							<a href="#contacto" class="landing-price-cta" onclick={scrollToContact}>
								{d.pricing.contactCta}
							</a>
						{:else}
							<a href="{prefix}/register" class="landing-price-cta">{d.pricing.select}</a>
						{/if}
					</article>
				{/each}
			</div>
			<p class="landing-pricing-tax">{d.pricing.taxNote}</p>
		</div>
	</section>

	<LandingFaq {d} />
	<div use:reveal>
		<LandingContact {d} />
	</div>

	<section class="landing-cta-band" use:reveal>
		<div class="landing-container landing-cta-band-inner">
			<p class="landing-eyebrow landing-eyebrow--on-dark">{d.ctaBand.eyebrow}</p>
			<h2 class="font-title landing-cta-band-title">{d.ctaBand.title}</h2>
			<p class="landing-cta-band-subtitle">{d.ctaBand.subtitle}</p>
			<div class="landing-cta-band-actions">
				<a href="{prefix}/register" class="landing-hero-primary">{d.ctaBand.primary}</a>
				<a href="{prefix}/login" class="landing-cta-band-secondary">{d.ctaBand.secondary}</a>
			</div>
			<ul class="landing-cta-band-bullets">
				{#each d.ctaBand.bullets as bullet}
					<li>{bullet}</li>
				{/each}
			</ul>
		</div>
	</section>

	<footer class="landing-footer" use:reveal>
		<div class="landing-container landing-footer-grid">
			<div class="landing-footer-brand">
				<img
					src="/amrap-white-logo.png"
					alt="AMRAP"
					width="120"
					height="32"
					class="h-9 w-auto object-contain object-left"
				/>
				<ul class="landing-footer-contact">
					<li><a href="mailto:{d.footer.email}">{d.footer.email}</a></li>
					<li>{d.footer.address}</li>
				</ul>
			</div>

			<div>
				<h4 class="landing-footer-heading">{d.footer.legal}</h4>
				<ul class="landing-footer-list">
					{#each d.footer.legalLinks as link}
						<li><a href={link.href}>{link.label}</a></li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="landing-footer-bottom">
			<div class="landing-container landing-footer-bottom-inner">
				<img
					src="/amrap-white-logo.png"
					alt=""
					width="96"
					height="26"
					class="h-6 w-auto object-contain opacity-70"
				/>
				<p>© {year} {d.footer.copyright}</p>
			</div>
		</div>
	</footer>
</div>
