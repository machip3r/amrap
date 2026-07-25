import { test, expect } from "@playwright/test";
import { loginViaUi } from "../helpers/auth-ui";
import { declineInviteViaUi } from "../helpers/invite-ui";
import {
  resolveOwnerGymId,
  seedPendingGymRoleUser,
} from "../helpers/supabase";
import { ownerCredsPath, readCreds } from "../fixtures/owner";

test.describe("multi-user: invite decline", () => {
  test("pending staff declines invite and lands on marketing home", async ({
    page,
  }) => {
    const owner = readCreds(ownerCredsPath());
    const gymId = await resolveOwnerGymId(owner);
    const staff = await seedPendingGymRoleUser(gymId, "STAFF");

    await loginViaUi(page, staff.email, staff.password);
    await declineInviteViaUi(page);

    await expect(page).toHaveURL(/\/es\/?$/, { timeout: 30_000 });
    // Signed out after decline — login should be available.
    await page.goto("/es/login");
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("owner still sees cancelled staff in list", async ({ browser }) => {
    const owner = readCreds(ownerCredsPath());
    const gymId = await resolveOwnerGymId(owner);
    const staff = await seedPendingGymRoleUser(gymId, "STAFF");

    const invitee = await browser.newContext();
    const inviteePage = await invitee.newPage();
    await loginViaUi(inviteePage, staff.email, staff.password);
    await declineInviteViaUi(inviteePage);
    await expect(inviteePage).toHaveURL(/\/es\/?$/, { timeout: 30_000 });
    await invitee.close();

    const ownerCtx = await browser.newContext({
      storageState: "e2e/.auth/owner.json",
    });
    const ownerPage = await ownerCtx.newPage();
    await ownerPage.goto("/es/staff");
    // Desktop table + mobile cards both render the name; one may be CSS-hidden.
    const nameHit = ownerPage.getByText(staff.fullName);
    await expect(nameHit.first()).toBeAttached({ timeout: 30_000 });
    await expect(
      ownerPage.getByText(/Invitación cancelada/i).first(),
    ).toBeAttached();
    await ownerCtx.close();
  });
});
