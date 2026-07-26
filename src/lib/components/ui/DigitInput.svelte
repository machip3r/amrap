<script lang="ts">
	import { parseClampedInt, sanitizeDigitsInput } from '$lib/validation/schemas';
	import { inputControlClass, inputInvalidClass } from './input-styles';

	type Props = {
		id?: string;
		name?: string;
		value: number;
		min?: number;
		max: number;
		/** Max digit characters allowed while typing (defaults from `max`). */
		maxDigits?: number;
		fallback?: number;
		disabled?: boolean;
		required?: boolean;
		invalid?: boolean;
		describedBy?: string;
		'aria-label'?: string;
		/** When set, replaces the default form-control styles (e.g. compact timer pills). */
		class?: string;
		onChange: (next: number) => void;
	};

	let {
		id = undefined,
		name = undefined,
		value,
		min = 0,
		max,
		maxDigits = undefined,
		fallback = min,
		disabled = false,
		required = false,
		invalid = false,
		describedBy = undefined,
		'aria-label': ariaLabel = undefined,
		class: className = undefined,
		onChange
	}: Props = $props();

	const digitCap = $derived(
		maxDigits ?? String(Math.max(Math.abs(min), Math.abs(max))).length
	);

	let text = $state(String(value));

	$effect(() => {
		text = String(value);
	});

	function commit(raw: string) {
		const next = parseClampedInt(raw, min, max, fallback);
		text = String(next);
		if (next !== value) onChange(next);
	}
</script>

<input
	{id}
	{name}
	type="text"
	inputmode="numeric"
	pattern="[0-9]*"
	autocomplete="off"
	spellcheck={false}
	{disabled}
	{required}
	aria-invalid={invalid || undefined}
	aria-describedby={describedBy}
	aria-label={ariaLabel}
	value={text}
	maxlength={digitCap}
	class={className ?? `${inputControlClass} ${inputInvalidClass(invalid)}`}
	oninput={(e) => {
		const cleaned = sanitizeDigitsInput(e.currentTarget.value, digitCap);
		text = cleaned;
	}}
	onchange={(e) => commit(e.currentTarget.value)}
	onblur={(e) => commit(e.currentTarget.value)}
/>
