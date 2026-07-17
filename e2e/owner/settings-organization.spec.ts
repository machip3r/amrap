import { test, expect } from "@playwright/test";

test.describe("owner settings and organization", () => {
  test("settings branding page loads", async ({ page }) => {
    await page.goto("/es/settings");
    await expect(page).toHaveURL(/\/es\/settings/);
    await expect(page.getByRole("heading", { name: "Configuración" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mi menú" }),
    ).toBeVisible();
    await expect(
      page.getByRole("switch", { name: /Vista general/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Personalización", exact: true }),
    ).toBeVisible();
  });

  test("owner can hide a nav page from their personal menu", async ({ page }) => {
    await page.goto("/es/settings");
    await expect(
      page.getByRole("heading", { name: "Mi menú" }),
    ).toBeVisible();

    const paymentsSwitch = page.getByRole("switch", { name: /Pagos/i });
    await expect(paymentsSwitch).toBeVisible();
    await paymentsSwitch.click();
    await expect(paymentsSwitch).toHaveAttribute("aria-checked", "false");

    await page.getByRole("button", { name: "Guardar menú" }).click();
    await expect(page.getByText("Cambios guardados")).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await expect(
      page.locator("aside").getByRole("link", { name: "Pagos" }),
    ).toHaveCount(0);

    // Restore for later tests / shared user state
    await page.goto("/es/settings");
    const restore = page.getByRole("switch", { name: /Pagos/i });
    await expect(restore).toHaveAttribute("aria-checked", "false");
    await restore.click();
    await page.getByRole("button", { name: "Guardar menú" }).click();
    await expect(page.getByText("Cambios guardados")).toBeVisible();
  });

  test("organization page loads with plan UI", async ({ page }) => {
    await page.goto("/es/organization");
    await expect(page).toHaveURL(/\/es\/organization/);
    await expect(page.getByRole("heading", { name: "Organización" })).toBeVisible();
    await expect(page.getByText(/Plan gratuito|Starter|Growth|Pro/i).first()).toBeVisible();
  });
});
