import { test as setup, expect } from "@playwright/test";
import { completeOnboardingViaUi, loginViaUi } from "../helpers/auth-ui";
import {
  ensureAuthDir,
  provisionalCredsPath,
  provisionalStoragePath,
  seedOwnerAccount,
  writeCreds,
} from "../fixtures/owner";

setup("seed provisional owner and save storage state", async ({ page }) => {
  ensureAuthDir();
  const creds = await seedOwnerAccount(true);
  writeCreds(provisionalCredsPath(), creds);

  await loginViaUi(page, creds.email, creds.password);
  await completeOnboardingViaUi(page, {
    fullName: creds.fullName,
    roleIntent: "manager",
    gymName: creds.gymName,
    planName: creds.planName,
  });

  await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();
  await page.context().storageState({ path: provisionalStoragePath() });
});
