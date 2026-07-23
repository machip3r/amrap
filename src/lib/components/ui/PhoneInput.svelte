<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Locale } from '$lib/i18n/config';
	import {
		DEFAULT_PHONE_COUNTRY,
		PHONE_COUNTRIES,
		countryByIso2,
		flagEmoji,
		formatInternationalPhone
	} from '$lib/phone/countries';
	import { LIMITS, sanitizePhoneInput } from '$lib/validation/schemas';

	type Props = {
		/** Form field name — submitted value is E.164 (`+{dial}{10 digits}`) or empty. */
		name?: string;
		id: string;
		locale: Locale;
		/** Controlled national value (digits only, max 10). */
		value?: string;
		onchange?: (digits: string) => void;
		defaultCountry?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		autocomplete?: string;
		/** Accessible label for the country dial selector. */
		countryLabel: string;
		invalid?: boolean;
		describedBy?: string;
		class?: string;
	};

	let {
		name = 'phone',
		id,
		locale,
		value = $bindable(''),
		onchange = undefined,
		defaultCountry = DEFAULT_PHONE_COUNTRY,
		placeholder = undefined,
		disabled = false,
		required = false,
		autocomplete = 'tel-national',
		countryLabel,
		invalid = false,
		describedBy = undefined,
		class: className = ''
	}: Props = $props();

	const listId = $derived.by(() => `phone-countries-${id}`);

	let rootEl: HTMLDivElement | undefined = $state();
	let triggerEl: HTMLButtonElement | undefined = $state();

	let iso2 = $state(DEFAULT_PHONE_COUNTRY);
	let countrySeeded = false;
	$effect.pre(() => {
		const next = countryByIso2(defaultCountry)?.iso2 ?? DEFAULT_PHONE_COUNTRY;
		if (!countrySeeded) {
			countrySeeded = true;
			iso2 = next;
		}
	});
	let menuOpen = $state(false);
	let menuPos = $state<{ top: number; left: number; width: number } | null>(null);

	const dial = $derived(countryByIso2(iso2)?.dial ?? '52');
	const submitted = $derived(
		value.length === LIMITS.phone ? formatInternationalPhone(dial, value) : ''
	);

	const controlSurface =
		'min-h-[var(--control-height)] box-border rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-base text-[var(--color-text)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60';

	const invalidClass = $derived(
		invalid
			? 'border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
			: ''
	);

	function regionLabel(code: string): string {
		try {
			return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
		} catch {
			return code;
		}
	}

	function commit(nextIso: string, nextNational: string) {
		const digits = sanitizePhoneInput(nextNational);
		iso2 = nextIso;
		value = digits;
		onchange?.(digits);
	}

	function placeMenu() {
		const rect = triggerEl?.getBoundingClientRect();
		if (!rect) return;
		const width = Math.min(18 * 16, window.innerWidth - 24);
		let left = rect.left;
		if (left + width > window.innerWidth - 12) {
			left = Math.max(12, window.innerWidth - width - 12);
		}
		const spaceBelow = window.innerHeight - rect.bottom - 12;
		const menuHeight = Math.min(14 * 16, spaceBelow > 160 ? spaceBelow : 224);
		const openUp = spaceBelow < 160 && rect.top > spaceBelow;
		menuPos = {
			top: openUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
			left,
			width
		};
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	$effect(() => {
		if (!menuOpen) {
			menuPos = null;
			return;
		}
		placeMenu();
		const onResize = () => placeMenu();
		window.addEventListener('resize', onResize);
		window.addEventListener('scroll', onResize, true);
		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onResize, true);
		};
	});

	$effect(() => {
		if (!menuOpen) return;
		function onPointerDown(e: MouseEvent) {
			const target = e.target as Node;
			if (
				rootEl?.contains(target) ||
				(target instanceof Element && target.closest(`#${CSS.escape(listId)}`))
			) {
				return;
			}
			menuOpen = false;
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') menuOpen = false;
		}
		document.addEventListener('mousedown', onPointerDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onPointerDown);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

<div bind:this={rootEl} class="relative {className}">
	<input type="hidden" {name} value={submitted} readonly />
	<div class="flex items-stretch gap-2">
		<div class="relative shrink-0">
			<button
				bind:this={triggerEl}
				type="button"
				{disabled}
				aria-label={countryLabel}
				aria-haspopup="listbox"
				aria-expanded={menuOpen}
				aria-controls={listId}
				onclick={() => (menuOpen = !menuOpen)}
				class="inline-flex h-full min-h-[var(--control-height)] items-center gap-1.5 px-3 font-medium hover:border-[var(--color-ring)] {controlSurface} {invalidClass}"
			>
				<span class="text-[1.1rem] leading-none" aria-hidden="true">{flagEmoji(iso2)}</span>
				<span class="leading-none tabular-nums text-[var(--color-muted)]">+{dial}</span>
				<ChevronDown
					class="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform {menuOpen
						? 'rotate-180'
						: ''}"
					aria-hidden="true"
				/>
			</button>
		</div>

		<input
			{id}
			type="tel"
			inputmode="numeric"
			autocomplete={autocomplete as HTMLInputElement['autocomplete']}
			{disabled}
			{required}
			maxlength={LIMITS.phone}
			pattern={String.raw`\d{10}`}
			{placeholder}
			{value}
			aria-invalid={invalid || undefined}
			aria-describedby={describedBy}
			oninput={(e) => commit(iso2, (e.currentTarget as HTMLInputElement).value)}
			onpaste={(e) => {
				e.preventDefault();
				commit(iso2, e.clipboardData?.getData('text') ?? '');
			}}
			class="min-w-0 flex-1 px-4 leading-none tabular-nums placeholder-[var(--color-muted)] {controlSurface} {invalidClass}"
		/>
	</div>
</div>

{#if menuOpen && menuPos}
	<ul
		use:portal
		id={listId}
		role="listbox"
		aria-label={countryLabel}
		style="position: fixed; top: {menuPos.top}px; left: {menuPos.left}px; width: {menuPos.width}px; max-height: 14rem;"
		class="z-[60] overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
	>
		{#each PHONE_COUNTRIES as c (c.iso2)}
			{@const selected = c.iso2 === iso2}
			<li role="option" aria-selected={selected}>
				<button
					type="button"
					class="flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left text-base transition-colors hover:bg-[var(--color-surface-hover)] {selected
						? 'bg-[var(--color-primary-soft)] font-medium text-[var(--color-text)]'
						: 'text-[var(--color-text)]'}"
					onclick={() => {
						commit(c.iso2, value);
						menuOpen = false;
					}}
				>
					<span class="text-[1.1rem] leading-none" aria-hidden="true">{flagEmoji(c.iso2)}</span>
					<span class="min-w-0 flex-1 truncate">{regionLabel(c.iso2)}</span>
					<span class="shrink-0 tabular-nums text-[var(--color-muted)]">+{c.dial}</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}
