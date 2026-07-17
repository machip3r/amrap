import { test, expect } from "@playwright/test";

test.describe("provisional owner powers", () => {
  test("provisional can open staff, trainers, and organization", async ({
    page,
  }) => {
    await page.goto("/es/dashboard");
    await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();

    await page.goto("/es/staff");
    await expect(page.getByRole("heading", { name: "Personal" })).toBeVisible();

    await page.goto("/es/trainers");
    await expect(page.getByRole("heading", { name: "Entrenadores" })).toBeVisible();

    await page.goto("/es/organization");
    await expect(page.getByRole("heading", { name: "Organización" })).toBeVisible();

    await page.goto("/es/settings");
    await expect(page.getByRole("heading", { name: "Configuración" })).toBeVisible();
  });
});
