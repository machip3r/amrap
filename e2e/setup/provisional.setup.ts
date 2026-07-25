import { test as setup, expect } from "@playwright/test";
import { loginViaUi, setActiveGymCookie } from "../helpers/auth-ui";
import { resolveOwnerGymId } from "../helpers/supabase";
import {
  ensureAuthDir,
  provisionalCredsPath,
  provisionalStoragePath,
  seedOwnerAccount,
  writeCreds,
} from "../fixtures/owner";

setup("seed provisional owner and save storage state", async ({ page, baseURL }) => {
  ensureAuthDir();
  const creds = await seedOwnerAccount(true);
  writeCreds(provisionalCredsPath(), creds);

  await loginViaUi(page, creds.email, creds.password);

  const gymId = await resolveOwnerGymId(creds);
  await setActiveGymCookie(page, gymId, baseURL);

  await page.goto("/es/dashboard");
  await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();
  await page.context().storageState({ path: provisionalStoragePath() });
});
