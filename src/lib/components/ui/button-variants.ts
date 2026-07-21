export type ButtonVariant = 'primary' | 'primaryBlock' | 'toolbar' | 'ghost' | 'link';

/** Shared class map — use `toolbar` for page header “Add …” CTAs (and matching `<a>` links). */
export const buttonVariants: Record<ButtonVariant, string> = {
	primary:
		'inline-flex min-h-[var(--touch-target)] items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-base font-semibold text-[var(--color-primary-on)] shadow-md transition-colors duration-200 hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70',
	primaryBlock:
		'mt-2 inline-flex min-h-[var(--touch-target)] w-full items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-base font-semibold text-[var(--color-primary-on)] shadow-md transition-colors duration-200 hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70',
	toolbar:
		'inline-flex h-11 min-h-[var(--touch-target)] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--color-primary)] px-3.5 text-sm font-semibold leading-none text-[var(--color-primary-on)] shadow-sm transition-colors duration-200 hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70',
	ghost:
		'inline-flex min-h-[var(--touch-target)] items-center justify-center text-center text-[var(--color-muted)] transition-colors duration-200 hover:text-[var(--color-text)] disabled:opacity-70',
	link: 'text-base text-[var(--color-primary)] underline transition-colors hover:opacity-80'
};
