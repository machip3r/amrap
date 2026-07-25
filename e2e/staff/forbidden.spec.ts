import { test, expect } from "@playwright/test";

test.describe("staff forbidden owner routes", () => {
  test("organization, staff, and trainers show forbidden", async ({ page }) => {
    await page.goto("/es/organization");
    await expect(page.getByText("No tienes permiso")).toBeVisible();

    await page.goto("/es/staff");
    await expect(page.getByText("No tienes permiso")).toBeVisible();

    await page.goto("/es/trainers");
    await expect(page.getByText("No tienes permiso")).toBeVisible();
  });

  test("settings page loads for staff", async ({ page }) => {
    await page.goto("/es/settings");
    await expect(page).toHaveURL(/\/es\/settings/);
    await expect(page.getByRole("heading", { name: "Configuración" })).toBeVisible();
  });
});
