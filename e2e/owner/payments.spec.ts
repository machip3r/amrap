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
      name: /^Socio$/i,
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

  test("register new member from payment member search and select them", async ({
    page,
  }) => {
    const memberName = uniquePersonLabel("PagoNuevo");
    const email = uniqueEmail("e2e.paynew");

    await page.goto("/es/payments");
    await expect(page.getByRole("heading", { name: "Pagos" })).toBeVisible();
    await page.getByRole("button", { name: "Registrar pago" }).click();

    const paymentDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: "Registrar pago" }),
    });
    await expect(paymentDialog).toBeVisible();

    const combobox = paymentDialog.getByRole("combobox", { name: /^Socio$/i });
    await combobox.click();
    await paymentDialog
      .getByRole("option", { name: /Registrar nuevo socio/i })
      .getByRole("button")
      .click();

    const createDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: "Nuevo miembro" }),
    });
    await expect(createDialog).toBeVisible();
    await createDialog.locator('input[name="name"]').fill(memberName);
    await createDialog.locator('input[name="email"]').fill(email);
    await createDialog.getByRole("button", { name: "Registrar" }).click();
    await expect(createDialog).toBeHidden({ timeout: 45_000 });

    await expect(paymentDialog).toBeVisible();
    await expect(combobox).toHaveValue(memberName);
    await expect(
      paymentDialog.getByRole("button", { name: "Registrar", exact: true }),
    ).toBeEnabled();
  });
});
