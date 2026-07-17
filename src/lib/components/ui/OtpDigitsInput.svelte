<script lang="ts">
	const DIGITS = 6;
	export const OTP_LENGTH = DIGITS;

	type Props = {
		value: string;
		onchange?: (value: string) => void;
		oncomplete?: (value: string) => void;
		disabled?: boolean;
		label: string;
		error?: string;
		autofocus?: boolean;
	};

	let {
		value = $bindable(''),
		onchange,
		oncomplete,
		disabled = false,
		label,
		error = undefined,
		autofocus = true
	}: Props = $props();

	const baseId = 'otp-digits';
	let refs: (HTMLInputElement | null)[] = $state([]);

	const digits = $derived(Array.from({ length: DIGITS }, (_, i) => value[i] ?? ''));

	function onlyDigits(raw: string): string {
		return raw.replace(/\D/g, '').slice(0, DIGITS);
	}

	function notifyChange(next: string) {
		value = next;
		onchange?.(next);
	}

	function setDigit(index: number, char: string) {
		const next = digits.map((d, i) => (i === index ? char : d));
		const joined = next.join('').replace(/\s/g, '');
		notifyChange(joined);

		if (char && index < DIGITS - 1) {
			refs[index + 1]?.focus();
		}

		if (joined.length === DIGITS && next.every(Boolean)) {
			oncomplete?.(joined);
		}
	}

	function handleChange(index: number, raw: string) {
		const cleaned = onlyDigits(raw);
		if (cleaned.length === 0) {
			setDigit(index, '');
			return;
		}
		if (cleaned.length === 1) {
			setDigit(index, cleaned);
			return;
		}
		const filled = onlyDigits(digits.join('').slice(0, index) + cleaned);
		notifyChange(filled);
		const focusAt = Math.min(filled.length, DIGITS - 1);
		refs[focusAt]?.focus();
		if (filled.length === DIGITS) oncomplete?.(filled);
	}

	function handleKeyDown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace') {
			if (digits[index]) {
				setDigit(index, '');
			} else if (index > 0) {
				e.preventDefault();
				setDigit(index - 1, '');
				refs[index - 1]?.focus();
			}
			return;
		}
		if (e.key === 'ArrowLeft' && index > 0) {
			e.preventDefault();
			refs[index - 1]?.focus();
		}
		if (e.key === 'ArrowRight' && index < DIGITS - 1) {
			e.preventDefault();
			refs[index + 1]?.focus();
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const pasted = onlyDigits(e.clipboardData?.getData('text') ?? '');
		if (!pasted) return;
		notifyChange(pasted);
		const focusAt = Math.min(pasted.length, DIGITS) - 1;
		refs[Math.max(0, focusAt)]?.focus();
		if (pasted.length === DIGITS) oncomplete?.(pasted);
	}

	$effect(() => {
		if (autofocus) refs[0]?.focus();
	});
</script>

<div class="flex flex-col gap-1.5">
	<span class="text-sm font-medium text-[var(--color-text)]">{label}</span>
	<div class="flex justify-between gap-2 sm:gap-3" role="group" aria-label={label}>
		{#each digits as digit, index}
			{@const id = `${baseId}-${index}`}
			{@const invalid = Boolean(error)}
			<input
				{id}
				bind:this={refs[index]}
				type="text"
				inputmode="numeric"
				autocomplete={index === 0 ? 'one-time-code' : 'off'}
				autocapitalize="off"
				autocorrect="off"
				spellcheck={false}
				maxlength={1}
				{disabled}
				aria-invalid={invalid || undefined}
				aria-label="{label} {index + 1}"
				value={digit}
				oninput={(e) => handleChange(index, e.currentTarget.value)}
				onkeydown={(e) => handleKeyDown(index, e)}
				onpaste={handlePaste}
				onfocus={(e) => e.currentTarget.select()}
				class="h-12 w-10 flex-1 rounded-lg border bg-[var(--color-surface-hover)] text-center font-title text-xl font-semibold text-[var(--color-text)] transition-colors focus:outline-none focus:ring-1 sm:h-14 sm:w-12 {invalid
					? 'border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
					: 'border-[var(--color-border)] focus:border-[var(--color-ring)] focus:ring-[var(--color-ring)]'} {disabled
					? 'opacity-60'
					: ''}"
			/>
		{/each}
	</div>
	{#if error}
		<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{error}</p>
	{/if}
</div>
