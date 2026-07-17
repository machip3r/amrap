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
    const search = page.getByRole("textbox", { name: /^Socio$/i });
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
});
