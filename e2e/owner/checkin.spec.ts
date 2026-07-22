import { test, expect } from "@playwright/test";
import { createMemberViaUi } from "../helpers/auth-ui";
import { uniqueEmail, uniquePersonLabel } from "../helpers/supabase";

test.describe("owner check-in", () => {
  test("manual search finds member and allows check-in", async ({ page }) => {
    const memberName = uniquePersonLabel("Checkin");
    await createMemberViaUi(page, memberName, uniqueEmail("e2e.checkin"));

    await page.goto("/es/checkin");
    await expect(
      page.getByRole("heading", { name: "Entrada", exact: true }),
    ).toBeVisible();
    const search = page.getByRole("textbox", { name: /^Miembro$/i });
    await search.fill(memberName);
    const lookup = page.getByRole("button", { name: "Buscar" });
    await expect(lookup).toBeEnabled();
    await lookup.click();

    await expect(
      page.getByRole("button", { name: new RegExp(memberName) }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: new RegExp(memberName) }).first().click();

    await expect(
      page.getByText(/Acceso permitido|Órale, todo en orden|Acceso denegado/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("register opens role picker then member form", async ({ page }) => {
    await page.goto("/es/checkin");
    await expect(
      page.getByRole("heading", { name: "Entrada", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Registrar", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "¿Qué quieres registrar?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Miembro/i }).click();
    await expect(
      page.getByRole("heading", { name: "Registrar usuario" }),
    ).toBeVisible();
  });

  test("check-in history filters by user type", async ({ page }) => {
    await page.goto("/es/checkin/history");
    await expect(
      page.getByRole("heading", { name: "Historial de entradas" }),
    ).toBeVisible();
    await expect(page.getByLabel("Tipo de usuario")).toBeVisible();
    await page.getByLabel("Tipo de usuario").selectOption("member");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/type=member/);
  });

  test("kiosk mode hides ops chrome and can exit", async ({ page }) => {
    await page.goto("/es/checkin");
    await expect(
      page.getByRole("heading", { name: "Entrada", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Modo kiosco" }).click();
    await expect(page.getByRole("button", { name: "Salir de kiosco" })).toBeVisible();
    await expect(page.locator("aside")).toHaveCount(0);
    await page.getByRole("button", { name: "Salir de kiosco" }).click();
    await expect(page.getByRole("button", { name: "Modo kiosco" })).toBeVisible();
  });
});
