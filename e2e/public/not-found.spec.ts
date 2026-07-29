import { expect, test } from "@playwright/test";
import { getDictionary } from "../../src/lib/i18n/dictionaries";

const d = getDictionary("es");

test.describe("Global not-found page", () => {
  test("unknown top-level path shows friendly 404", async ({ page }) => {
    const response = await page.goto("/ruta-que-no-existe");
    expect(response?.status()).toBe(404);

    await expect(
      page.getByRole("heading", { name: d.entityNotFound.titleGeneric }),
    ).toBeVisible();
    await expect(page.getByText(d.entityNotFound.bodyGeneric)).toBeVisible();
    await expect(
      page.getByRole("link", { name: d.entityNotFound.goLanding }),
    ).toBeVisible();
  });

  test("unknown locale path shows friendly 404", async ({ page }) => {
    const response = await page.goto("/es/pagina-inventada");
    expect(response?.status()).toBe(404);

    await expect(
      page.getByRole("heading", { name: d.entityNotFound.titleGeneric }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: d.entityNotFound.goLanding }),
    ).toBeVisible();
  });
});
