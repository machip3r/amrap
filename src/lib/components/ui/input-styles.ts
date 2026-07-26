/** Shared visual styles for text/digit form controls (`Input`, `DigitInput`). */
export const inputControlClass =
	'box-border min-h-[var(--control-height)] w-full min-w-0 max-w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-base text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60';

export function inputInvalidClass(invalid: boolean): string {
	return invalid
		? 'border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
		: '';
}
