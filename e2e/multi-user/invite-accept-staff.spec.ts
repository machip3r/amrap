import { test, expect } from "@playwright/test";
import { loginViaUi } from "../helpers/auth-ui";
import {
  acceptInviteViaUi,
  completeWelcomeOpsViaUi,
} from "../helpers/invite-ui";
import {
  resolveOwnerGymId,
  seedPendingGymRoleUser,
} from "../helpers/supabase";
import { ownerCredsPath, readCreds } from "../fixtures/owner";

test.describe("multi-user: owner gym → staff invite accept", () => {
  test("pending staff accepts invite, completes welcome, reaches dashboard", async ({
    page,
  }) => {
    const owner = readCreds(ownerCredsPath());
    const gymId = await resolveOwnerGymId(owner);
    const staff = await seedPendingGymRoleUser(gymId, "STAFF");

    await loginViaUi(page, staff.email, staff.password);
    await acceptInviteViaUi(page);
    if (page.url().includes("/welcome")) {
      await completeWelcomeOpsViaUi(page);
    }

    await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();

    await page.goto("/es/members");
    await expect(page.getByRole("heading", { name: "Miembros" })).toBeVisible();
    await expect(page.getByText("No tienes permiso")).toHaveCount(0);
  });
});
