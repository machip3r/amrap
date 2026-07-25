import { test as setup, expect } from "@playwright/test";
import { loginViaUi, setActiveGymCookie } from "../helpers/auth-ui";
import {
  resolveOwnerGymId,
  seedAcceptedGymRoleUser,
} from "../helpers/supabase";
import { ownerCredsPath, readCreds } from "../fixtures/owner";
import {
  ensureAuthDir,
  staffCredsPath,
  staffStoragePath,
  writeRoleCreds,
} from "../fixtures/role-users";

setup("seed staff against owner gym and save storage state", async ({ page, baseURL }) => {
  ensureAuthDir();
  const owner = readCreds(ownerCredsPath());
  const gymId = await resolveOwnerGymId(owner);
  const staff = await seedAcceptedGymRoleUser(gymId, "STAFF");
  writeRoleCreds(staffCredsPath(), { ...staff, gymId, role: "STAFF" });

  await loginViaUi(page, staff.email, staff.password);
  await setActiveGymCookie(page, gymId, baseURL);
  await page.goto("/es/dashboard");
  await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();
  await page.context().storageState({ path: staffStoragePath() });
});
