import { test, expect } from "@playwright/test";

test.describe("owner plans", () => {
  test("plans page shows seeded plan and supports create when under limit", async ({
    page,
  }) => {
    await page.goto("/es/plans");
    await expect(page.getByRole("heading", { name: "Planes" })).toBeVisible();
    await expect(page.getByText("Mensual E2E").first()).toBeVisible();

    const addButton = page.getByRole("button", { name: "Añadir plan" });
    if (await addButton.isEnabled()) {
      await addButton.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: "Nuevo plan" })).toBeVisible();
      const planName = `Plan Extra ${Date.now()}`;
      await dialog.locator('input[name="name"]').fill(planName);
      await dialog.locator('input[name="price"]').fill("200");
      await dialog.locator('input[name="duration_days"]').fill("7");
      await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
      await expect(page.getByText(planName).first()).toBeVisible({
        timeout: 20_000,
      });
    } else {
      await expect(page.getByText(/plan gratuito|2/i).first()).toBeVisible();
    }
  });
});
