import { test, expect } from "@playwright/test";
import { loginViaUi } from "../helpers/auth-ui";
import {
  acceptInviteViaUi,
  completeWelcomeMemberViaUi,
} from "../helpers/invite-ui";
import {
  resolveOwnerGymId,
  seedPendingMemberInvite,
} from "../helpers/supabase";
import { ownerCredsPath, readCreds } from "../fixtures/owner";

test.describe("multi-user: member invite accept", () => {
  test("pending member accepts invite, completes welcome, reaches /me", async ({
    page,
  }) => {
    const owner = readCreds(ownerCredsPath());
    const gymId = await resolveOwnerGymId(owner);
    const member = await seedPendingMemberInvite(gymId);

    await loginViaUi(page, member.email, member.password);
    await acceptInviteViaUi(page);
    if (page.url().includes("/welcome")) {
      await completeWelcomeMemberViaUi(page);
    }

    await expect(page).toHaveURL(/\/es\/me(?:\/)?$/, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
    await expect(page.getByText(member.fullName).first()).toBeVisible();
  });
});
