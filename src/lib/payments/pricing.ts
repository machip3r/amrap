import { z } from 'zod';
import { amountSchema, formString } from '$lib/validation/schemas';

/** Desk pricing mode — UPPERCASE tokens in forms / Zod. */
export type PaymentPricingMode = 'FULL' | 'DISCOUNT' | 'TRIAL';

export const paymentPricingModeSchema = z.enum(['FULL', 'DISCOUNT', 'TRIAL']);

export type ResolvedPaymentAmounts = {
	/** What the gym collected (0 for trial). */
	amount: number;
	/** Catalog price at record time. */
	listAmount: number;
};

/**
 * Resolve charged vs list amount from desk pricing mode.
 * FULL always charges the catalog; TRIAL charges 0; DISCOUNT uses the override.
 * DISCOUNT with charged 0 is treated as trial.
 */
export function resolvePaymentAmounts(opts: {
	listAmount: number;
	mode: PaymentPricingMode;
	/** Required when mode is DISCOUNT (validated by caller / Zod). */
	chargedAmount?: number;
}): ResolvedPaymentAmounts {
	const list = Number(opts.listAmount);
	if (opts.mode === 'TRIAL') {
		return { amount: 0, listAmount: list };
	}
	if (opts.mode === 'DISCOUNT') {
		const charged = Number(opts.chargedAmount ?? list);
		if (charged === 0) return { amount: 0, listAmount: list };
		return { amount: charged, listAmount: list };
	}
	return { amount: list, listAmount: list };
}

/** UI / list badge from stored amounts. */
export function paymentPricingBadge(
	amount: number,
	listAmount: number | null | undefined
): 'trial' | 'discount' | 'full' {
	if (amount === 0) return 'trial';
	if (listAmount != null && Number(listAmount) > amount) return 'discount';
	return 'full';
}

export type PricingParseResult =
	| { ok: true; amounts: ResolvedPaymentAmounts }
	| { ok: false; field: 'amount' | 'pricing_mode'; reason: 'invalid' | 'discount_too_high' };

/**
 * Parse desk `pricing_mode` + optional `amount` against a known catalog price.
 */
export function parseDeskPricing(
	formData: FormData,
	listAmount: number
): PricingParseResult {
	const modeRaw = (formString(formData, 'pricing_mode') || 'FULL').toUpperCase();
	const modeParsed = paymentPricingModeSchema.safeParse(modeRaw);
	if (!modeParsed.success) {
		return { ok: false, field: 'pricing_mode', reason: 'invalid' };
	}
	const mode = modeParsed.data;

	if (mode === 'FULL' || mode === 'TRIAL') {
		return { ok: true, amounts: resolvePaymentAmounts({ listAmount, mode }) };
	}

	const amountParsed = amountSchema.safeParse(formString(formData, 'amount'));
	if (!amountParsed.success) {
		return { ok: false, field: 'amount', reason: 'invalid' };
	}
	const charged = amountParsed.data;
	if (charged > 0 && charged >= listAmount) {
		return { ok: false, field: 'amount', reason: 'discount_too_high' };
	}

	return {
		ok: true,
		amounts: resolvePaymentAmounts({
			listAmount,
			mode: 'DISCOUNT',
			chargedAmount: charged
		})
	};
}
