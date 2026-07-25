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

test.describe("multi-user: owner gym → trainer invite accept", () => {
  test("pending trainer accepts invite, completes welcome, reaches trainer dashboard", async ({
    page,
  }) => {
    const owner = readCreds(ownerCredsPath());
    const gymId = await resolveOwnerGymId(owner);
    const trainer = await seedPendingGymRoleUser(gymId, "TRAINER");

    await loginViaUi(page, trainer.email, trainer.password);
    await acceptInviteViaUi(page);
    if (page.url().includes("/welcome")) {
      await completeWelcomeOpsViaUi(page);
    }

    await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Tu semana" })).toBeVisible();

    await page.goto("/es/checkin");
    await expect(page.getByText("No tienes permiso")).toBeVisible({
      timeout: 20_000,
    });
  });
});
