import { test, expect } from "@playwright/test";

test.describe("trainer shell", () => {
  test("trainer dashboard and allowed routes", async ({ page }) => {
    await page.goto("/es/dashboard");
    await expect(page.getByRole("heading", { name: "Tu semana" })).toBeVisible();

    await page.goto("/es/classes");
    await expect(page.getByRole("heading", { name: "Clases" })).toBeVisible();

    await page.goto("/es/timers");
    await expect(page).toHaveURL(/\/es\/timers/);
    await expect(page.getByText("No tienes permiso")).toHaveCount(0);
  });

  test("trainer cannot use check-in, members, payments, or org", async ({
    page,
  }) => {
    await page.goto("/es/checkin");
    await expect(page.getByText("No tienes permiso")).toBeVisible({
      timeout: 20_000,
    });

    await page.goto("/es/members");
    await expect(page.getByText("No tienes permiso")).toBeVisible();

    await page.goto("/es/payments");
    await expect(page.getByText("No tienes permiso")).toBeVisible();

    await page.goto("/es/organization");
    await expect(page.getByText("No tienes permiso")).toBeVisible();

    await page.goto("/es/staff");
    await expect(page.getByText("No tienes permiso")).toBeVisible();
  });
});
