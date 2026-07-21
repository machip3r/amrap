<script lang="ts">
	import AmrapLogo from '$lib/components/landing/AmrapLogo.svelte';

	type Props = {
		logoUrlLight?: string | null;
		logoUrlDark?: string | null;
		gymName?: string;
		size?: 'sm' | 'md';
		class?: string;
	};

	let {
		logoUrlLight = null,
		logoUrlDark = null,
		gymName = undefined,
		size = 'md',
		class: className = ''
	}: Props = $props();

	const lightLogo = $derived(logoUrlLight || logoUrlDark);
	const darkLogo = $derived(logoUrlDark || logoUrlLight);
	const hasCustomLogo = $derived(Boolean(lightLogo || darkLogo));
	const sizeClass = $derived(size === 'sm' ? 'h-9 max-w-[7.5rem]' : 'h-9 max-w-full');
</script>

{#if hasCustomLogo}
	<img
		src={lightLogo ?? darkLogo ?? ''}
		alt={gymName || 'AMRAP'}
		class="w-auto object-contain object-left dark:hidden {sizeClass} {className}"
	/>
	<img
		src={darkLogo ?? lightLogo ?? ''}
		alt={gymName || 'AMRAP'}
		class="hidden w-auto object-contain object-left dark:block {sizeClass} {className}"
	/>
{:else}
	<AmrapLogo class="w-auto {sizeClass} {className}" />
{/if}
