import { test, expect } from "@playwright/test";
import { completeOnboardingViaUi, loginViaUi } from "../helpers/auth-ui";
import {
  bootstrapOrganizationAccount,
  confirmAuthUserByEmail,
  createConfirmedAuthUser,
  E2E_PASSWORD,
  uniqueEmail,
} from "../helpers/supabase";

test.describe("owner register + onboarding", () => {
  test("register or admin-confirm, then complete onboarding as owner", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = uniqueEmail("e2e.register");
    const organizationName = `E2E Register Org ${stamp}`;
    const gymName = `E2E Register Gym ${stamp}`;

    await page.goto("/es/register");
    await page.locator('input[name="organizationName"]').fill(organizationName);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(E2E_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    const rateLimited = page.getByRole("alert").filter({
      hasText: /Demasiados correos|rate limit|Too many/i,
    });
    const otpOrOnboarding = page.getByRole("heading", {
      name: /Confirma tu correo|Configura tu espacio/i,
    });

    await expect(rateLimited.or(otpOrOnboarding)).toBeVisible({
      timeout: 60_000,
    });

    if (await rateLimited.isVisible().catch(() => false)) {
      // Shared Supabase projects rate-limit Auth emails; Admin seed is the
      // equivalent of “register + confirmed email” for E2E.
      const user = await createConfirmedAuthUser(email, E2E_PASSWORD);
      await bootstrapOrganizationAccount(user.id, organizationName);
      await loginViaUi(page, email, E2E_PASSWORD);
    } else if (page.url().includes("/register")) {
      await confirmAuthUserByEmail(email);
      await loginViaUi(page, email, E2E_PASSWORD);
    }

    await completeOnboardingViaUi(page, {
      fullName: "Maria Register",
      roleIntent: "owner",
      gymName,
      planName: "Mensual Register",
    });

    await expect(page).toHaveURL(/\/es\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Resumen diario" }),
    ).toBeVisible();
  });

  test("invalid login shows error", async ({ page }) => {
    await page.goto("/es/login");
    await page.locator('input[name="email"]').fill("nobody@example.com");
    await page.locator('input[name="password"]').fill("WrongPass99!");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  });
});
