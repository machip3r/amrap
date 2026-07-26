<script lang="ts">
	import { inputControlClass, inputInvalidClass } from './input-styles';

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
		inputmode?: 'email' | 'text' | 'decimal' | 'numeric' | 'search';
		enterkeyhint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
		spellcheck?: boolean;
		invalid?: boolean;
		describedBy?: string;
		disabled?: boolean;
		class?: string;
		oninput?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
		onblur?: (event: FocusEvent) => void;
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
		enterkeyhint = undefined,
		spellcheck = undefined,
		invalid = false,
		describedBy = undefined,
		disabled = false,
		class: className = '',
		oninput,
		onkeydown,
		onblur
	}: Props = $props();
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
	{disabled}
	autocomplete={autocomplete as HTMLInputElement['autocomplete']}
	{inputmode}
	enterkeyhint={enterkeyhint}
	{spellcheck}
	aria-invalid={invalid || undefined}
	aria-describedby={describedBy}
	class="{inputControlClass} {inputInvalidClass(invalid)} {className}"
	oninput={oninput}
	{onkeydown}
	{onblur}
/>
