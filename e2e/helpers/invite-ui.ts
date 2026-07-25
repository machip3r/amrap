import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Staff / trainer welcome — date of birth only (must be ≥13 years). */
export async function completeWelcomeOpsViaUi(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/es\/welcome/, { timeout: 30_000 });
  await page.locator('input[name="date_of_birth"]').fill("1995-06-15");
  await page.getByRole("button", { name: "Continuar" }).click();
}

/** Member welcome — DOB + gender + height + weight. */
export async function completeWelcomeMemberViaUi(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/es\/welcome/, { timeout: 30_000 });
  await page.locator('input[name="date_of_birth"]').fill("1995-06-15");
  await page.locator('select[name="gender"]').selectOption("MALE");
  await page.locator('input[name="height_cm"]').fill("175");
  await page.locator('input[name="weight_kg"]').fill("72");
  await page.getByRole("button", { name: "Continuar" }).click();
}

export async function acceptInviteViaUi(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/es\/invite(?:\/)?$/, { timeout: 30_000 });
  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect(page).toHaveURL(
    /\/es\/(welcome|invite\/password|dashboard|me)/,
    { timeout: 45_000 },
  );
}

export async function declineInviteViaUi(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/es\/invite(?:\/)?$/, { timeout: 30_000 });
  await page.getByRole("button", { name: "Rechazar" }).click();
}
