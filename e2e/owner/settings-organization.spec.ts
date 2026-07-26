import { test, expect } from "@playwright/test";

test.describe("owner settings and organization", () => {
  test("settings branding page loads", async ({ page }) => {
    await page.goto("/es/settings");
    await expect(page).toHaveURL(/\/es\/settings/);
    await expect(page.getByRole("heading", { name: "Configuración" })).toBeVisible();
    // My menu (nav visibility) temporarily disabled
    await expect(page.getByRole("heading", { name: "Mi menú" })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Personalización", exact: true }),
    ).toBeVisible();
  });

  test.skip("owner can hide a nav page from their personal menu", async ({
    page,
  }) => {
    // Skipped while Settings → My menu is disabled in the UI.
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
    await expect(page.getByRole("heading", { name: "Feedback del gym" })).toBeVisible();
    await expect(page.getByText(/Plan gratuito|Starter|Growth|Pro/i).first()).toBeVisible();

    const contact = page.getByRole("link", { name: /Contactar a AMRAP/i });
    await expect(contact).toBeVisible();
    await expect(contact).toHaveAttribute("href", /\/es#contact$/);

    await page.getByRole("button", { name: /Mejorar plan/i }).first().click();
    const confirm = page.getByRole("dialog");
    await expect(confirm.getByRole("heading", { name: "Mejorar suscripción" })).toBeVisible();
    await expect(confirm.getByText("Facturación")).toBeVisible();
    await expect(confirm.getByText("Mensual")).toBeVisible();
    await expect(confirm.getByText(/Anual/i)).toBeVisible();
    await expect(
      confirm.getByRole("button", { name: "Confirmar mejora" }),
    ).toBeVisible();
  });

  test("owner profile does not compose feedback", async ({ page }) => {
    await page.goto("/es/profile");
    await expect(page).toHaveURL(/\/es\/profile/);
    await expect(page.getByRole("heading", { name: "Carlos Owner" })).toBeVisible();
    await expect(
      page.getByText("No puedes enviar feedback con esta cuenta"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Feedback del gym" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enviar feedback" })).toHaveCount(0);
  });
});
