import { test, expect } from "@playwright/test";
import { createMemberViaUi } from "../helpers/auth-ui";
import { uniqueEmail, uniquePersonLabel } from "../helpers/supabase";

test.describe("owner payments", () => {
  test("register a manual payment for a member", async ({ page }) => {
    const memberName = uniquePersonLabel("Pago");
    await createMemberViaUi(page, memberName, uniqueEmail("e2e.paymem"));

    await page.goto("/es/payments");
    await expect(page.getByRole("heading", { name: "Pagos" })).toBeVisible();
    await page.getByRole("button", { name: "Registrar pago" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const combobox = dialog.getByRole("combobox", {
      name: /Buscar socio/i,
    });
    await combobox.fill(memberName);
    await dialog
      .getByRole("option", { name: new RegExp(memberName) })
      .getByRole("button")
      .click();

    await dialog.getByRole("button", { name: "Registrar", exact: true }).click();
    await expect(page.getByText(memberName).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
