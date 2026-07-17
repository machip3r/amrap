import { test, expect } from "@playwright/test";

test.describe("owner classes", () => {
  test("create a class in the catalog", async ({ page }) => {
    const className = `Clase E2E ${Date.now()}`;

    await page.goto("/es/classes");
    await expect(page.getByRole("heading", { name: "Clases" })).toBeVisible();
    await page.getByRole("button", { name: "Nueva clase" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Nueva clase/i })).toBeVisible();
    await dialog.locator('input[name="name"]').fill(className);
    await dialog.locator('input[name="capacity"]').fill("12");
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(page.getByText(className).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
