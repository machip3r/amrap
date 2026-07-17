import { expect, test } from "@playwright/test";
import { getLandingDictionary } from "../../lib/i18n/landing-dictionaries";

const d = getLandingDictionary("es");

test.describe("Public marketing landing", () => {
  test("shows hero, pricing, FAQ, and register CTAs", async ({ page }) => {
    await page.goto("/es");

    await expect(page.getByRole("heading", { level: 1, name: d.hero.title })).toBeVisible();
    await expect(page.getByRole("link", { name: d.hero.primaryCta }).first()).toBeVisible();

    await expect(page.locator("#producto")).toContainText(d.difference.title);
    await expect(page.locator("#proceso")).toContainText(d.process.title);
    await expect(page.locator("#precios")).toContainText(d.pricing.title);
    await expect(page.locator("#preguntas")).toContainText(d.faq.title);
    await expect(page.locator("#contacto")).toContainText(d.contact.title);

    await page.getByRole("button", { name: d.pricing.annual }).click();
    await expect(page.getByText(d.pricing.plans[1]!.priceAnnual, { exact: true })).toBeVisible();

    await page.getByRole("link", { name: d.hero.primaryCta }).first().click();
    await expect(page).toHaveURL(/\/es\/register/);
  });
});
