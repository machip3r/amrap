import { test, expect, type Page } from "@playwright/test";
import { readRoleCreds, memberCredsPath } from "../fixtures/role-users";

/**
 * Full `page.goto` against SvelteKit can throw `net::ERR_ABORTED` when the
 * client router cancels the document load (seen on /me/timers). Treat abort as
 * OK when we land on the expected path.
 */
async function gotoMemberPath(page: Page, path: string): Promise<void> {
  try {
    await page.goto(path, { waitUntil: "domcontentloaded" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/ERR_ABORTED|Navigation .* interrupted/i.test(message)) {
      throw error;
    }
  }
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(page).toHaveURL(new RegExp(`${escaped}/?$`), { timeout: 30_000 });
}

test.describe("member me shell", () => {
  test("home, membership, QR, classes, timers, inbox, and profile", async ({ page }) => {
    const member = readRoleCreds(memberCredsPath());

    await gotoMemberPath(page, "/es/me");
    await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
    await expect(page.getByText(member.fullName).first()).toBeVisible();

    await gotoMemberPath(page, "/es/me/membership");
    await expect(page.getByRole("heading", { name: "Membresía" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Estado actual" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Planes del gym" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial de pagos" })).toBeVisible();

    // Active membership: cancel on status card; renew/upgrade via gym plans when online.
    await expect(page.getByRole("button", { name: "Cancelar membresía" })).toBeVisible();

    const renewOnPlans = page.getByRole("button", { name: "Renovar" }).first();
    if (await renewOnPlans.isVisible().catch(() => false)) {
      await renewOnPlans.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      const dialog = page.getByRole("dialog");
      const gatewayStep = dialog.getByText("Elige la pasarela de pago");
      const deskTitle = dialog.getByRole("heading", { name: "Paga en recepción" });
      await expect(gatewayStep.or(deskTitle)).toBeVisible();
      const cancelInDialog = dialog.getByRole("button", { name: /Cancelar|Cerrar/ }).first();
      await cancelInDialog.click();
      await expect(page.getByRole("dialog")).toBeHidden();
    }

    const changeSub = page.getByRole("button", { name: "Cambiar suscripción" }).first();
    if (await changeSub.isVisible().catch(() => false)) {
      await expect(changeSub).toBeVisible();
    }

    await page.getByRole("button", { name: "Cancelar membresía" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "¿Cancelar tu membresía?" })).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await gotoMemberPath(page, "/es/me/qr");
    await expect(page.getByRole("heading", { name: "Mi QR" })).toBeVisible();

    await gotoMemberPath(page, "/es/me/classes");
    await expect(page.getByRole("heading", { name: "Clases" })).toBeVisible();

    // Prefer in-app nav (client transition) — avoids full-document abort races.
    await page
      .locator("aside")
      .getByRole("link", { name: "Timers" })
      .click();
    await expect(page).toHaveURL(/\/es\/me\/timers\/?$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Timers" })).toBeVisible({
      timeout: 30_000,
    });

    await gotoMemberPath(page, "/es/me/inbox");
    await expect(page.getByRole("heading", { name: "Buzón" })).toBeVisible();

    await gotoMemberPath(page, "/es/me/profile");
    await expect(page.getByRole("heading", { name: member.fullName })).toBeVisible();
  });

  test("member cannot open ops dashboard as staff chrome", async ({ page }) => {
    try {
      await page.goto("/es/dashboard", { waitUntil: "domcontentloaded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/ERR_ABORTED|Navigation .* interrupted/i.test(message)) {
        throw error;
      }
    }
    // Member without gym role should be redirected away from ops dashboard.
    await expect(page).not.toHaveURL(/\/es\/dashboard$/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/es\/me/);
  });
});
