import { test, expect } from "@playwright/test";

test.describe("owner login + dashboard", () => {
  test("dashboard loads with ops chrome and quick actions", async ({ page }) => {
    await page.goto("/es/dashboard");
    await expect(page).toHaveURL(/\/es\/dashboard/);
    await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vista general" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Miembros" }).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Nuevo miembro|Añadir miembro/i }).first(),
    ).toBeVisible();
  });
});
