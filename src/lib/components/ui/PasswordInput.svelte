<script lang="ts">
	type Props = {
		id?: string;
		name: string;
		value?: string;
		placeholder?: string;
		maxlength?: number;
		minlength?: number;
		required?: boolean;
		autocomplete?: string;
		showLabel: string;
		hideLabel: string;
		invalid?: boolean;
		describedBy?: string;
		oninput?: (event: Event) => void;
	};

	let {
		id = undefined,
		name,
		value = $bindable(''),
		placeholder = undefined,
		maxlength = undefined,
		minlength = undefined,
		required = false,
		autocomplete = undefined,
		showLabel,
		hideLabel,
		invalid = false,
		describedBy = undefined,
		oninput
	}: Props = $props();

	let show = $state(false);

	const baseClass =
		'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] py-2.5 pl-4 pr-10 text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]';
</script>

<div class="relative">
	<input
		{id}
		{name}
		type={show ? 'text' : 'password'}
		bind:value
		{placeholder}
		{maxlength}
		{minlength}
		{required}
		autocomplete={autocomplete as HTMLInputElement['autocomplete']}
		aria-invalid={invalid || undefined}
		aria-describedby={describedBy}
		class="{baseClass} {invalid
			? 'border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
			: ''}"
		oninput={oninput}
	/>
	<button
		type="button"
		aria-label={show ? hideLabel : showLabel}
		onclick={() => (show = !show)}
		class="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-muted)] transition-colors duration-200 hover:text-[var(--color-text)]"
	>
		{#if show}
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
				/>
			</svg>
		{:else}
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
				/>
			</svg>
		{/if}
	</button>
</div>
