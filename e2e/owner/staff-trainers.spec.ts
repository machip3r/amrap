import { test, expect } from "@playwright/test";
import { uniqueEmail, uniquePersonLabel } from "../helpers/supabase";

test.describe("owner staff and trainers", () => {
  test("invite staff and see pending row", async ({ page }) => {
    const name = uniquePersonLabel("Staff");
    const email = uniqueEmail("e2e.staff");

    await page.goto("/es/staff");
    await expect(page.getByRole("heading", { name: "Personal" })).toBeVisible();
    await page.getByRole("button", { name: "Nuevo staff" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="name"]').fill(name);
    await dialog.locator('input[name="email"]').fill(email);
    await dialog.getByRole("button", { name: "Registrar" }).click();

    await expect(
      page.getByRole("link", { name: new RegExp(name) }).first(),
    ).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Pendiente").first()).toBeVisible();
  });

  test("invite trainer and see pending row", async ({ page }) => {
    const name = uniquePersonLabel("Trainer");
    const email = uniqueEmail("e2e.trainer");

    await page.goto("/es/trainers");
    await expect(page.getByRole("heading", { name: "Entrenadores" })).toBeVisible();
    await page.getByRole("button", { name: "Nuevo entrenador" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="name"]').fill(name);
    await dialog.locator('input[name="email"]').fill(email);
    await dialog.getByRole("button", { name: "Registrar" }).click();

    await expect(
      page.getByRole("link", { name: new RegExp(name) }).first(),
    ).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Pendiente").first()).toBeVisible();
  });
});
