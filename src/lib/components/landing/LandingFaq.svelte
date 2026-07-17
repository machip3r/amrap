<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import type { LandingDictionary } from '$lib/i18n/landing-dictionaries';

	type Props = {
		d: LandingDictionary;
	};

	let { d }: Props = $props();

	let open = $state<number | null>(0);
	const baseId = 'landing-faq';
</script>

<section id="preguntas" class="landing-section landing-section--muted">
	<div class="landing-container">
		<h2 class="font-title landing-section-title">{d.faq.title}</h2>
		<p class="landing-section-subtitle">{d.faq.subtitle}</p>
		<div class="landing-faq-list">
			{#each d.faq.items as item, index}
				{@const isOpen = open === index}
				{@const panelId = `${baseId}-panel-${index}`}
				{@const buttonId = `${baseId}-button-${index}`}
				<div class="landing-faq-item {isOpen ? 'landing-faq-item--open' : ''}">
					<h3 class="landing-faq-q">
						<button
							id={buttonId}
							type="button"
							class="landing-faq-trigger"
							aria-expanded={isOpen}
							aria-controls={panelId}
							onclick={() => (open = isOpen ? null : index)}
						>
							<span>{item.q}</span>
							<ChevronDown class="landing-faq-chevron" aria-hidden="true" />
						</button>
					</h3>
					<div
						id={panelId}
						role="region"
						aria-labelledby={buttonId}
						hidden={!isOpen}
						class="landing-faq-a"
					>
						<p>{item.a}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
