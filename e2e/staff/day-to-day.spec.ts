import { test, expect } from "@playwright/test";
import { createMemberViaUi } from "../helpers/auth-ui";
import { uniqueEmail, uniquePersonLabel } from "../helpers/supabase";

test.describe("staff day-to-day", () => {
  test("dashboard, members create, and check-in page load", async ({ page }) => {
    await page.goto("/es/dashboard");
    await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Miembros" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Organización" })).toHaveCount(0);

    const memberName = uniquePersonLabel("StaffSocio");
    await createMemberViaUi(page, memberName, uniqueEmail("e2e.staff.mem"));

    await page.goto("/es/checkin");
    await expect(
      page.getByRole("heading", { name: "Entrada", exact: true }),
    ).toBeVisible();
    await expect(page.locator("#checkin-manual")).toBeVisible();
  });

  test("plans and payments are reachable", async ({ page }) => {
    await page.goto("/es/plans");
    await expect(page.getByRole("heading", { name: "Planes" })).toBeVisible();

    await page.goto("/es/payments");
    await expect(page.getByRole("heading", { name: "Pagos" })).toBeVisible();
  });
});
