<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'primaryBlock' | 'ghost' | 'link';

	type Props = {
		type?: 'button' | 'submit';
		disabled?: boolean;
		class?: string;
		variant?: Variant;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	};

	let {
		type = 'button',
		disabled = false,
		class: className = '',
		variant = 'primary',
		onclick = undefined,
		children
	}: Props = $props();

	const variants: Record<Variant, string> = {
		primary:
			'rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] shadow-md transition-colors duration-200 hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70',
		primaryBlock:
			'mt-2 w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] shadow-md transition-colors duration-200 hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70',
		ghost:
			'text-[var(--color-muted)] transition-colors duration-200 hover:text-[var(--color-text)] disabled:opacity-70',
		link: 'text-sm text-[var(--color-primary)] underline transition-colors hover:opacity-80'
	};
</script>

<button {type} {disabled} {onclick} class="{variants[variant]} {className}">
	{@render children()}
</button>
