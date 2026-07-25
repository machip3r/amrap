import { test as setup, expect } from "@playwright/test";
import { loginViaUi } from "../helpers/auth-ui";
import {
  resolveOwnerGymId,
  seedAcceptedMemberUser,
} from "../helpers/supabase";
import { ownerCredsPath, readCreds } from "../fixtures/owner";
import {
  ensureAuthDir,
  memberCredsPath,
  memberStoragePath,
  writeRoleCreds,
} from "../fixtures/role-users";

setup("seed member against owner gym and save storage state", async ({ page }) => {
  ensureAuthDir();
  const owner = readCreds(ownerCredsPath());
  const gymId = await resolveOwnerGymId(owner);
  const member = await seedAcceptedMemberUser(gymId);
  writeRoleCreds(memberCredsPath(), { ...member, gymId, role: "MEMBER" });

  await loginViaUi(page, member.email, member.password);
  await expect(page).toHaveURL(/\/es\/me(?:\/)?$/, { timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  await page.context().storageState({ path: memberStoragePath() });
});
