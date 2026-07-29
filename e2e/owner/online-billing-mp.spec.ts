import { test, expect } from '@playwright/test';
import {
	getOrganizationIdForUser,
	readOrgBilling,
	writeOrgBilling
} from '../helpers/stripe';
import { readCreds, ownerCredsPath } from '../fixtures/owner';

test.describe('owner online member billing (Mercado Pago settings)', () => {
	test('settings shows online billing gate on Freemium and unlocks on Starter', async ({
		page
	}) => {
		const creds = readCreds(ownerCredsPath());
		const organizationId = await getOrganizationIdForUser(creds.userId);

		const snapshot = await readOrgBilling(organizationId);
		let restored = false;

		async function restore() {
			if (!restored) {
				await writeOrgBilling(organizationId, snapshot);
				restored = true;
			}
		}

		try {
			await writeOrgBilling(organizationId, {
				...snapshot,
				plan_tier: 'FREEMIUM'
			});

			await page.goto('/es/settings');
			await expect(page.getByRole('heading', { name: 'Pasarela de pago' })).toBeVisible();
			await expect(
				page.getByText(/Pasarela de pago no incluida en el plan gratuito|not included on the free plan/i)
			).toBeVisible();

			await writeOrgBilling(organizationId, {
				...snapshot,
				plan_tier: 'STARTER'
			});

			await page.goto('/es/settings');
			await expect(page.getByRole('heading', { name: 'Pasarela de pago' })).toBeVisible();
			await expect(page.getByText('Mercado Pago')).toBeVisible();
			// Either connect CTA (env configured) or not-configured hint.
			const connect = page.getByRole('button', {
				name: /Conectar Mercado Pago|Connect Mercado Pago|^(Conectar|Connect)$/i
			});
			const notConfigured = page.getByText(
				/Ninguna pasarela está configurada|No payment gateway is configured/i
			);
			await expect(connect.or(notConfigured)).toBeVisible();
		} finally {
			await restore();
		}
	});
});
