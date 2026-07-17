<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { initTheme, resolveTheme, toggleTheme, type Theme } from '$lib/theme';

	type Props = {
		label: string;
		class?: string;
	};

	let { label, class: className = '' }: Props = $props();

	let theme = $state<Theme>('light');

	onMount(() => {
		initTheme();
		theme = resolveTheme();
	});

	function handleToggle() {
		theme = toggleTheme(theme);
	}
</script>

<button
	type="button"
	onclick={handleToggle}
	class="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] {className}"
	aria-label={label}
>
	<Moon class="h-5 w-5 scale-100 transition-all dark:scale-0 dark:opacity-0" aria-hidden="true" />
	<Sun
		class="absolute h-5 w-5 scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100"
		aria-hidden="true"
	/>
</button>
