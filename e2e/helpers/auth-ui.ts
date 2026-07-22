import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function loginViaUi(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/es/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function completeOnboardingViaUi(
  page: Page,
  options: {
    fullName: string;
    roleIntent: "owner" | "manager";
    gymName: string;
    planName?: string;
  },
): Promise<void> {
  await expect(page).toHaveURL(/\/es\/onboarding/, { timeout: 30_000 });

  await page.locator('input[name="fullName"]').fill(options.fullName);
  await page
    .locator(`input[name="roleIntent"][value="${options.roleIntent}"]`)
    .check({ force: true });
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.locator('input[name="gymName"]')).toBeVisible({
    timeout: 20_000,
  });
  await page.locator('input[name="gymName"]').fill(options.gymName);
  await page.locator('input[name="branchName"]').fill("Principal");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Qué le cobras a tus miembros" }),
  ).toBeVisible({ timeout: 30_000 });

  if (options.planName) {
    await page.locator('input[name="name"]').fill(options.planName);
    await page.locator('input[name="price"]').fill("500");
    await page.locator('input[name="duration_days"]').fill("30");
    await page.getByRole("button", { name: "Agregar paquete" }).click();
    await expect(page.getByText(options.planName)).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Continuar" }).click();
  } else {
    await page.getByRole("button", { name: "Saltar por ahora" }).click();
  }

  await expect(page.getByRole("heading", { name: "Todo listo" })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Ir al panel" }).click();
  await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 30_000 });
}

export async function createMemberViaUi(
  page: Page,
  name: string,
  email: string,
): Promise<void> {
  await page.goto("/es/members");
  await page.getByRole("button", { name: "Añadir miembro" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.locator('input[name="email"]').fill(email);
  await dialog.getByRole("button", { name: "Registrar" }).click();
  await expect(dialog).toBeHidden({ timeout: 45_000 });
  await expect(
    page.getByRole("link", { name: new RegExp(name) }).first(),
  ).toBeVisible({ timeout: 45_000 });
}
