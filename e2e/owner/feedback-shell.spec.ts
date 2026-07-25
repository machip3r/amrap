import { test, expect } from "@playwright/test";
import { loginViaUi } from "../helpers/auth-ui";
import {
  resolveOwnerGymId,
  seedAcceptedGymRoleUser,
  seedAcceptedMemberUser,
  seedGymFeedbackMessage,
  uniquePersonLabel,
} from "../helpers/supabase";
import { ownerCredsPath, readCreds } from "../fixtures/owner";

test.describe("owner gym feedback list", () => {
  test("owner sees seeded gym feedback on organization", async ({ page }) => {
    const creds = readCreds(ownerCredsPath());
    const gymId = await resolveOwnerGymId(creds);
    const body = `E2E gym feedback ${uniquePersonLabel("fb")}`;

    await seedGymFeedbackMessage({ gymId, body });

    await page.goto("/es/organization");
    await expect(page.getByRole("heading", { name: "Feedback del gym" })).toBeVisible();
    await expect(page.getByText(body)).toBeVisible();
  });
});

/** Fresh browser session (no owner storageState) for staff / member logins. */
test.describe("staff and member feedback compose", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("staff can compose feedback on ops profile", async ({ page }) => {
    const creds = readCreds(ownerCredsPath());
    const gymId = await resolveOwnerGymId(creds);
    const staff = await seedAcceptedGymRoleUser(gymId, "STAFF");

    await loginViaUi(page, staff.email, staff.password);
    await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 45_000 });

    await page.goto("/es/profile");
    await expect(page.getByRole("heading", { name: staff.fullName })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enviar feedback" })).toBeVisible();

    const message = `Staff feedback ${uniquePersonLabel("msg")}`;
    await page.locator("#feedback-body").fill(message);
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Feedback enviado. Gracias.")).toBeVisible();
  });

  test("member profile compose and inbox load", async ({ page }) => {
    const creds = readCreds(ownerCredsPath());
    const gymId = await resolveOwnerGymId(creds);
    const member = await seedAcceptedMemberUser(gymId);

    await loginViaUi(page, member.email, member.password);
    await expect(page).toHaveURL(/\/es\/me(?:\/)?$/, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();

    await page.goto("/es/me/inbox");
    await expect(page.getByRole("heading", { name: "Buzón" })).toBeVisible();
    await expect(page.getByText("Sin mensajes.")).toBeVisible();

    await page.goto("/es/me/profile");
    await expect(page.getByRole("heading", { name: member.fullName })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enviar feedback" })).toBeVisible();

    const message = `Member feedback ${uniquePersonLabel("msg")}`;
    await page.locator("#feedback-body").fill(message);
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Feedback enviado. Gracias.")).toBeVisible();
  });
});
