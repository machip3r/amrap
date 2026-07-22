<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		id?: string;
		name?: string;
		required?: boolean;
		value?: string;
		invalid?: boolean;
		describedBy?: string;
		disabled?: boolean;
		class?: string;
		onchange?: (event: Event) => void;
		children: Snippet;
	};

	let {
		id,
		name,
		required = false,
		value = $bindable(''),
		invalid = false,
		describedBy,
		disabled = false,
		class: className = '',
		onchange,
		children
	}: Props = $props();

	const chevron =
		"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")";

	const baseClass =
		'box-border min-h-[var(--control-height)] w-full min-w-0 max-w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-4 py-2.5 pr-10 text-base text-[var(--color-text)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60';
</script>

<select
	{id}
	{name}
	{required}
	{disabled}
	bind:value
	aria-invalid={invalid || undefined}
	aria-describedby={describedBy}
	class="{baseClass} {invalid
		? 'border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
		: ''} {className}"
	style="background-image: {chevron}"
	onchange={onchange}
>
	{@render children()}
</select>
