<script lang="ts">
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { PaymentPricingMode } from '$lib/payments/pricing';

	export type PaymentPricingLabels = {
		pricingLabel: string;
		pricingFull: string;
		pricingDiscount: string;
		pricingTrial: string;
		pricingHint: string;
		trialHint: string;
		discountHint: string;
		amount: string;
		listPrice: string;
	};

	type Props = {
		locale: Locale;
		listAmount: number;
		labels: PaymentPricingLabels;
		mode?: PaymentPricingMode;
		/** Charged amount string for DISCOUNT mode. */
		amount?: string;
		amountError?: string;
		/** Prefix for element ids (unique per form). */
		idPrefix?: string;
		onModeChange?: (mode: PaymentPricingMode) => void;
		onAmountChange?: (amount: string) => void;
	};

	let {
		locale,
		listAmount,
		labels,
		mode = $bindable<PaymentPricingMode>('FULL'),
		amount = $bindable(''),
		amountError,
		idPrefix = 'pay-pricing',
		onModeChange,
		onAmountChange
	}: Props = $props();

	function formatMoney(value: number) {
		try {
			return new Intl.NumberFormat(locale, {
				style: 'currency',
				currency: 'MXN',
				maximumFractionDigits: value % 1 === 0 ? 0 : 2
			}).format(value);
		} catch {
			return `$${value}`;
		}
	}

	function setMode(next: PaymentPricingMode) {
		mode = next;
		if (next === 'TRIAL') {
			amount = '0';
		} else if (next === 'FULL') {
			amount = String(listAmount);
		} else if (next === 'DISCOUNT' && (!amount || amount === '0' || amount === String(listAmount))) {
			amount = '';
		}
		onModeChange?.(next);
	}

	const chargedPreview = $derived(
		mode === 'TRIAL' ? 0 : mode === 'FULL' ? listAmount : Number(amount) || 0
	);
</script>

<div class="flex flex-col gap-3">
	<input type="hidden" name="pricing_mode" value={mode} />
	{#if mode === 'FULL'}
		<input type="hidden" name="amount" value={listAmount} />
	{:else if mode === 'TRIAL'}
		<input type="hidden" name="amount" value="0" />
	{/if}

	<div>
		<p id="{idPrefix}-mode-label" class="mb-2 text-sm font-medium text-[var(--color-text)]">
			{labels.pricingLabel}
		</p>
		<div
			role="radiogroup"
			aria-labelledby="{idPrefix}-mode-label"
			class="grid grid-cols-1 gap-2 sm:grid-cols-3"
		>
			<button
				type="button"
				role="radio"
				aria-checked={mode === 'FULL'}
				onclick={() => setMode('FULL')}
				class="rounded-lg border px-3 py-2.5 text-left text-sm transition-colors {mode === 'FULL'
					? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]'
					: 'border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:border-[var(--color-ring)]'}"
			>
				<span class="block font-semibold text-[var(--color-text)]">{labels.pricingFull}</span>
				<span class="mt-0.5 block text-xs tabular-nums text-[var(--color-muted)]">
					{formatMoney(listAmount)}
				</span>
			</button>
			<button
				type="button"
				role="radio"
				aria-checked={mode === 'DISCOUNT'}
				onclick={() => setMode('DISCOUNT')}
				class="rounded-lg border px-3 py-2.5 text-left text-sm transition-colors {mode ===
				'DISCOUNT'
					? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]'
					: 'border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:border-[var(--color-ring)]'}"
			>
				<span class="block font-semibold text-[var(--color-text)]">{labels.pricingDiscount}</span>
			</button>
			<button
				type="button"
				role="radio"
				aria-checked={mode === 'TRIAL'}
				onclick={() => setMode('TRIAL')}
				class="rounded-lg border px-3 py-2.5 text-left text-sm transition-colors {mode === 'TRIAL'
					? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]'
					: 'border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:border-[var(--color-ring)]'}"
			>
				<span class="block font-semibold text-[var(--color-text)]">{labels.pricingTrial}</span>
				<span class="mt-0.5 block text-xs text-[var(--color-muted)]">{formatMoney(0)}</span>
			</button>
		</div>
	</div>

	{#if mode === 'DISCOUNT'}
		<FormField
			label={labels.amount}
			htmlFor="{idPrefix}-amount"
			hint={labels.discountHint
				.replace('{list}', formatMoney(listAmount))
				.replace('{listPrice}', formatMoney(listAmount))}
			error={amountError}
		>
			{#snippet children({ invalid, describedBy })}
				<Input
					id="{idPrefix}-amount"
					name="amount"
					type="number"
					min={0}
					max={listAmount}
					step="0.01"
					inputmode="decimal"
					required
					placeholder="0.00"
					bind:value={amount}
					{invalid}
					{describedBy}
					oninput={(e) => {
						const v = (e.currentTarget as HTMLInputElement).value;
						amount = v;
						onAmountChange?.(v);
					}}
				/>
			{/snippet}
		</FormField>
	{:else if mode === 'TRIAL'}
		<p class="text-xs leading-snug text-[var(--color-muted)]">{labels.trialHint}</p>
	{:else}
		<p class="text-xs leading-snug text-[var(--color-muted)]">
			{labels.listPrice.replace('{amount}', formatMoney(listAmount))}
			{' · '}
			{labels.pricingHint}
		</p>
	{/if}

	{#if mode === 'DISCOUNT' && amount !== '' && Number.isFinite(chargedPreview)}
		<p class="text-xs tabular-nums text-[var(--color-muted)]" aria-live="polite">
			{labels.listPrice.replace('{amount}', formatMoney(listAmount))}
			→
			<span class="font-semibold text-[var(--color-text)]">{formatMoney(chargedPreview)}</span>
		</p>
	{/if}
</div>
