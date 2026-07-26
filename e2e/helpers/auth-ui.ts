import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

type ActionResult = {
  type?: string;
  location?: string;
  status?: number;
  data?: { error?: string; fieldErrors?: Record<string, string> };
  error?: unknown;
};

/** Persist active gym cookie into the browser context (and later storageState). */
export async function setActiveGymCookie(
  page: Page,
  gymId: string,
  baseURL?: string,
): Promise<void> {
  const origin = baseURL ?? "http://localhost:5173";
  await page.context().addCookies([
    {
      name: "amrap_gym_id",
      value: gymId,
      url: origin,
    },
  ]);
}

/**
 * Sign in via the login form action (same cookie jar as the page).
 * Avoids flaky Svelte bind/enhance UI filling for setup seeds.
 */
export async function loginViaUi(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/es/login");
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();

  const response = await page.request.post("/es/login?/login", {
    form: {
      locale: "es",
      email,
      password,
    },
    headers: {
      Accept: "application/json",
      "x-sveltekit-action": "true",
    },
  });

  const raw = await response.text();
  let result: ActionResult;
  try {
    result = JSON.parse(raw) as ActionResult;
  } catch {
    throw new Error(
      `Login action returned non-JSON (${response.status()}): ${raw.slice(0, 300)}`,
    );
  }

  if (result.type === "redirect" && result.location) {
    await page.goto(result.location);
    await expect(page).not.toHaveURL(/\/es\/login\/?$/);
    return;
  }

  const message =
    result.data?.error ??
    (result.data?.fieldErrors
      ? JSON.stringify(result.data.fieldErrors)
      : raw.slice(0, 400));
  throw new Error(`Login failed (${result.type ?? response.status()}): ${message}`);
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
    page.getByRole("heading", { name: "Membresías" }),
  ).toBeVisible({ timeout: 30_000 });

  if (options.planName) {
    await page.getByRole("button", { name: "Agregar costo de día/visita" }).click();
    await page.locator('input[name="day_pass_price"]').fill("80");
    await page.getByRole("button", { name: "Guardar precio" }).click();
    await expect(page.getByText("Pase del día / visita")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("$80 · 1d")).toBeVisible();

    await page.locator('input[name="name"]').fill(options.planName);
    await page.locator('input[name="price"]').fill("500");
    await page.locator('input[name="duration_days"]').fill("30");
    await page.getByRole("button", { name: "Agregar membresía" }).click();
    await expect(page.getByText(options.planName)).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Continuar" }).click();
  } else {
    await page.getByRole("button", { name: "Saltar por ahora" }).click();
  }

  await expect(
    page.getByRole("heading", { name: "Elige tu plan AMRAP" }),
  ).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar con plan gratuito" }).click();

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
  await expect(page.getByText("Internal Error")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Añadir miembro" })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("button", { name: "Añadir miembro" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.locator('input[name="email"]').fill(email);

  const planSelect = dialog.locator('select[name="plan_id"]');
  if ((await planSelect.count()) > 0) {
    const current = await planSelect.inputValue();
    if (!current) {
      const optionValues = await planSelect.locator("option").evaluateAll((opts) =>
        opts
          .map((o) => (o as HTMLOptionElement).value)
          .filter((v) => v.length > 0),
      );
      if (optionValues.length === 0) {
        throw new Error("createMemberViaUi: no plan options in dialog");
      }
      await planSelect.selectOption(optionValues[0]!);
    }
  }

  const submit = dialog.getByRole("button", { name: "Registrar" });
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();

  try {
    await expect(dialog).toBeHidden({ timeout: 45_000 });
  } catch (error) {
    if (await page.getByText("Internal Error").isVisible().catch(() => false)) {
      throw new Error("createMemberViaUi: members page returned Internal Error");
    }
    const alert = dialog.getByRole("alert").first();
    if (await alert.isVisible().catch(() => false)) {
      const text = (await alert.textContent()) ?? "";
      throw new Error(`createMemberViaUi: form error — ${text}`);
    }
    throw error;
  }

  await expect(
    page.getByRole("link", { name: new RegExp(name) }).first(),
  ).toBeVisible({ timeout: 45_000 });
}
