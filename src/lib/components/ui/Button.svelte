<script lang="ts">
	import type { Snippet } from 'svelte';
	import { buttonVariants, type ButtonVariant } from './button-variants';

	type Props = {
		type?: 'button' | 'submit';
		disabled?: boolean;
		class?: string;
		variant?: ButtonVariant;
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
</script>

<button {type} {disabled} {onclick} class="{buttonVariants[variant]} {className}">
	{@render children()}
</button>
