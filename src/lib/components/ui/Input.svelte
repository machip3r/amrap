<script lang="ts">
	type Props = {
		id: string;
		name: string;
		type?: string;
		value?: string;
		placeholder?: string;
		maxlength?: number;
		min?: string | number;
		max?: string | number;
		step?: string | number;
		required?: boolean;
		autocomplete?: string;
		inputmode?: 'email' | 'text' | 'decimal' | 'numeric';
		spellcheck?: boolean;
		invalid?: boolean;
		describedBy?: string;
		class?: string;
		oninput?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
	};

	let {
		id,
		name,
		type = 'text',
		value = $bindable(''),
		placeholder = undefined,
		maxlength = undefined,
		min = undefined,
		max = undefined,
		step = undefined,
		required = false,
		autocomplete = undefined,
		inputmode = undefined,
		spellcheck = undefined,
		invalid = false,
		describedBy = undefined,
		class: className = '',
		oninput,
		onkeydown
	}: Props = $props();

	const baseClass =
		'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]';
</script>

<input
	{id}
	{name}
	{type}
	bind:value
	{placeholder}
	{maxlength}
	min={min}
	max={max}
	step={step}
	{required}
	autocomplete={autocomplete as HTMLInputElement['autocomplete']}
	{inputmode}
	{spellcheck}
	aria-invalid={invalid || undefined}
	aria-describedby={describedBy}
	class="{baseClass} {invalid
		? 'border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
		: ''} {className}"
	oninput={oninput}
	{onkeydown}
/>
