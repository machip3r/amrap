import { test as setup, expect } from "@playwright/test";
import { loginViaUi, setActiveGymCookie } from "../helpers/auth-ui";
import {
  resolveOwnerGymId,
  seedAcceptedGymRoleUser,
} from "../helpers/supabase";
import { ownerCredsPath, readCreds } from "../fixtures/owner";
import {
  ensureAuthDir,
  trainerCredsPath,
  trainerStoragePath,
  writeRoleCreds,
} from "../fixtures/role-users";

setup("seed trainer against owner gym and save storage state", async ({ page, baseURL }) => {
  ensureAuthDir();
  const owner = readCreds(ownerCredsPath());
  const gymId = await resolveOwnerGymId(owner);
  const trainer = await seedAcceptedGymRoleUser(gymId, "TRAINER");
  writeRoleCreds(trainerCredsPath(), { ...trainer, gymId, role: "TRAINER" });

  await loginViaUi(page, trainer.email, trainer.password);
  await setActiveGymCookie(page, gymId, baseURL);
  await page.goto("/es/dashboard");
  await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Tu semana" })).toBeVisible();
  await page.context().storageState({ path: trainerStoragePath() });
});
