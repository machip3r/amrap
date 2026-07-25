import type { Page, Frame, FrameLocator } from '@playwright/test';
import { expect } from '@playwright/test';

export type PlanRowTier = 'STARTER' | 'GROWTH' | 'PRO';

const PLAN_LABEL: Record<PlanRowTier | 'FREEMIUM', RegExp> = {
	FREEMIUM: /Plan gratuito/i,
	STARTER: /Starter/i,
	GROWTH: /Growth/i,
	PRO: /Pro/i
};

export async function gotoOrganization(page: Page): Promise<void> {
	await page.goto('/es/organization');
	await expect(page).toHaveURL(/\/es\/organization/);
	await expect(page.getByRole('heading', { name: 'Organización' })).toBeVisible();
	await expect(page.locator('#subscription')).toBeVisible();
}

export async function expectCurrentPlan(page: Page, tier: keyof typeof PLAN_LABEL): Promise<void> {
	const section = page.locator('#subscription');
	await expect(section.getByText(/Plan actual/i)).toBeVisible();
	await expect(section.getByText(PLAN_LABEL[tier]).first()).toBeVisible();
}

/** Click the actionable Starter/Growth row (Mejorar plan / Cambiar). */
export async function openPlanConfirm(page: Page, tier: 'STARTER' | 'GROWTH'): Promise<void> {
	const label = tier === 'STARTER' ? /Starter/i : /Growth/i;
	const row = page.locator('#subscription li').filter({ hasText: label }).first();
	await expect(row.getByRole('button', { name: /Mejorar plan|Cambiar/i })).toBeVisible();
	await row.getByRole('button', { name: /Mejorar plan|Cambiar/i }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(
		dialog.getByRole('heading', { name: /Mejorar suscripción|Cambiar suscripción/i })
	).toBeVisible();
}

export async function chooseBillingInterval(
	page: Page,
	interval: 'month' | 'year'
): Promise<void> {
	const dialog = page.getByRole('dialog').filter({
		has: page.getByRole('heading', { name: /Mejorar suscripción|Cambiar suscripción/i })
	});
	// Click the visible interval label so Svelte onchange updates the hidden `interval` field.
	const label =
		interval === 'month'
			? dialog.getByText(/Mensual|Monthly/i).first()
			: dialog.getByText(/Anual|Annual/i).first();
	await label.click();
}

export async function submitPlanConfirm(page: Page): Promise<void> {
	const dialog = page.getByRole('dialog').filter({
		has: page.getByRole('heading', { name: /Mejorar suscripción|Cambiar suscripción/i })
	});
	await dialog.getByRole('button', { name: /Confirmar mejora|Confirmar cambio/i }).click();
}

/**
 * After confirm submit: wait for Embedded Checkout (or surface action errors).
 */
export async function waitForEmbeddedCheckout(page: Page): Promise<void> {
	const checkoutDialog = page.getByRole('dialog', { name: /Completar pago|Complete payment/i });
	const error = page.locator('[role="alert"]');

	await expect
		.poll(
			async () => {
				if (await checkoutDialog.isVisible().catch(() => false)) return 'checkout';
				if (await error.isVisible().catch(() => false)) {
					return `error:${(await error.textContent())?.trim() ?? ''}`;
				}
				return 'pending';
			},
			{ timeout: 30_000 }
		)
		.toMatch(/^checkout$/);
}

async function fillFirstVisible(
	scopes: Array<Page | Frame | FrameLocator>,
	selectors: string[],
	value: string
): Promise<boolean> {
	for (const scope of scopes) {
		for (const selector of selectors) {
			const loc = scope.locator(selector).first();
			try {
				if ((await loc.count()) === 0) continue;
				await loc.waitFor({ state: 'visible', timeout: 3_000 });
				await loc.click({ timeout: 3_000 });
				await loc.fill('');
				await loc.fill(value);
				return true;
			} catch {
				/* try next */
			}
		}
	}
	return false;
}

async function typeIntoFirstVisible(
	scopes: Array<Page | Frame | FrameLocator>,
	selectors: string[],
	value: string
): Promise<boolean> {
	for (const scope of scopes) {
		for (const selector of selectors) {
			const loc = scope.locator(selector).first();
			try {
				if ((await loc.count()) === 0) continue;
				await loc.waitFor({ state: 'visible', timeout: 3_000 });
				await loc.click({ timeout: 3_000 });
				await loc.pressSequentially(value, { delay: 40 });
				return true;
			} catch {
				/* try next */
			}
		}
	}
	return false;
}

/**
 * Complete Stripe Embedded Checkout with test card 4242…
 * Payment Element fields live in nested iframes; cardholder is often in the outer Checkout iframe.
 */
export async function fillEmbeddedCheckoutTestCard(page: Page): Promise<void> {
	await waitForEmbeddedCheckout(page);

	const checkoutDialog = page.getByRole('dialog', { name: /Completar pago|Complete payment/i });
	await expect(checkoutDialog).toBeVisible();

	// Wait until Stripe has mounted a usable Checkout surface.
	await expect
		.poll(
			async () => {
				for (const f of page.frames()) {
					const url = f.url();
					if (!/stripe|checkout/i.test(url) && f !== page.mainFrame()) continue;
					if (
						(await f
							.getByRole('button', { name: /Suscribir|Subscribe|Pagar|Pay/i })
							.count()
							.catch(() => 0)) > 0
					) {
						return true;
					}
					if (
						(await f
							.locator('#Field-numberInput, input[name="number"], input[autocomplete="cc-number"]')
							.count()
							.catch(() => 0)) > 0
					) {
						return true;
					}
				}
				return false;
			},
			{ timeout: 45_000 }
		)
		.toBeTruthy();

	const scopes: Array<Page | Frame | FrameLocator> = [
		page,
		...page.frames(),
		page.frameLocator('iframe[name*="stripe" i]').first(),
		page.frameLocator('iframe[src*="stripe" i]').first(),
		page.frameLocator('iframe[src*="checkout" i]').first(),
		checkoutDialog.frameLocator('iframe').first()
	];

	const numberOk = await typeIntoFirstVisible(
		scopes,
		[
			'#Field-numberInput',
			'input[name="number"]',
			'input[name="cardnumber"]',
			'input[autocomplete="cc-number"]',
			'input[placeholder*="1234" i]'
		],
		'4242424242424242'
	);
	if (!numberOk) {
		throw new Error('Could not find Stripe card number field');
	}

	const expiryOk = await typeIntoFirstVisible(
		scopes,
		[
			'#Field-expiryInput',
			'input[name="expiry"]',
			'input[name="exp-date"]',
			'input[autocomplete="cc-exp"]',
			'input[placeholder*="MM" i]'
		],
		'1234'
	);
	if (!expiryOk) {
		throw new Error('Could not find Stripe expiry field');
	}

	const cvcOk = await typeIntoFirstVisible(
		scopes,
		[
			'#Field-cvcInput',
			'input[name="cvc"]',
			'input[name="securityCode"]',
			'input[autocomplete="cc-csc"]',
			'input[placeholder*="CVC" i]'
		],
		'123'
	);
	if (!cvcOk) {
		throw new Error('Could not find Stripe CVC field');
	}

	// Cardholder name is required on MX / many embedded_page Checkouts.
	await fillFirstVisible(
		scopes,
		[
			'input[name="name"]',
			'input[autocomplete="cc-name"]',
			'input[placeholder*="name on card" i]',
			'input[placeholder*="nombre" i]',
			'#billingName',
			'#Field-nameInput'
		],
		'Carlos Owner'
	);

	await fillFirstVisible(
		scopes,
		[
			'#Field-postalCodeInput',
			'input[name="postalCode"]',
			'input[name="postal"]',
			'input[autocomplete="postal-code"]'
		],
		'01000'
	);

	let subscribed = false;
	for (const scope of scopes) {
		try {
			const pay = scope
				.getByRole('button', { name: /Suscribir|Subscribe|Pagar|Pay|Start trial|Confirmar/i })
				.first();
			if ((await pay.count()) === 0) continue;
			await pay.click({ timeout: 5_000 });
			subscribed = true;
			break;
		} catch {
			/* try next */
		}
	}

	if (!subscribed) {
		throw new Error('Could not click Stripe Subscribe button');
	}

	// Wait for Stripe to leave the Processing state (success redirect or dialog close).
	await expect
		.poll(
			async () => {
				if (page.url().includes('billing=success')) return 'success';
				const dialogVisible = await checkoutDialog.isVisible().catch(() => false);
				if (!dialogVisible) return 'closed';
				for (const f of page.frames()) {
					const processing = await f
						.getByRole('button', { name: /Processing|Procesando/i })
						.count()
						.catch(() => 0);
					if (processing > 0) return 'processing';
				}
				// Still open but not processing — may show an error; keep waiting briefly.
				return 'idle';
			},
			{ timeout: 90_000 }
		)
		.toMatch(/^(success|closed)$/);
}

export async function expectFlash(page: Page, text: RegExp | string): Promise<void> {
	await expect(page.getByText(text).first()).toBeVisible({ timeout: 20_000 });
}

export async function clickManageBilling(page: Page): Promise<void> {
	await page.getByRole('button', { name: /Gestionar facturación/i }).click();
}
