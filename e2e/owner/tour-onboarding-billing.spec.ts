import { test, expect } from '@playwright/test';

const OWNER_TOUR_STORAGE_KEY = 'amrap-owner-tour-v1';

test.describe('owner tour + onboarding billing UI', () => {
	test('settings can replay owner quickstart', async ({ page }) => {
		await page.goto('/es/settings');
		await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
		await page.evaluate((key) => localStorage.setItem(key, '1'), OWNER_TOUR_STORAGE_KEY);

		const replay = page.getByRole('button', { name: /Ver guía rápida|Replay/i });
		await expect(replay).toBeVisible();
		await replay.click();

		await expect(page).toHaveURL(/\/es\/dashboard\?tour=1/);
		await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
		await page.getByRole('button', { name: /Saltar guía|Skip guide/i }).click();
		await expect(page.getByRole('dialog')).toHaveCount(0);
	});
});
