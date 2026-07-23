import { test, expect } from "@playwright/test";
import { ownerCredsPath, readCreds } from "../fixtures/owner";
import {
  getOwnerGymId,
  getPersonIdForUser,
  seedMembershipForPerson,
  seedStandaloneGym,
} from "../helpers/supabase";

async function openIdentityList(page: import("@playwright/test").Page) {
  const trigger = page.getByRole("button", { name: "Elegir identidad" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const list = page.getByRole("listbox", { name: "Elegir identidad" });
  await expect(list).toBeVisible();
  return list;
}

test.describe("identity picker — same-gym dual", () => {
  test("owner + member at same gym can switch shells", async ({ page }) => {
    const creds = readCreds(ownerCredsPath());
    const gymId = await getOwnerGymId(creds.userId);
    const personId = await getPersonIdForUser(creds.userId);
    await seedMembershipForPerson(gymId, personId);

    await page.goto("/es/dashboard");
    await expect(page).toHaveURL(/\/es\/dashboard/);

    const opsList = await openIdentityList(page);
    await expect(
      opsList.getByRole("link", { name: new RegExp(`Dueño\\s+${creds.gymName}`) }),
    ).toBeVisible();
    await expect(
      opsList.getByRole("link", { name: new RegExp(`Miembro\\s+${creds.gymName}`) }),
    ).toBeVisible();
    // Activate member identity via the same URL the picker uses.
    await opsList
      .getByRole("link", { name: new RegExp(`Miembro\\s+${creds.gymName}`) })
      .click();

    await expect(page).toHaveURL(/\/es\/me(?:\/)?$/, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Elegir identidad" })).toHaveText(/Miembro/);

    await page.goto(`/es/context?kind=ops&gymId=${gymId}`);
    await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Elegir identidad" })).toHaveText(/Dueño/);
  });
});

test.describe("identity picker — cross-gym", () => {
  test("owner at gym A + member at gym B switches contexts", async ({ page }) => {
    const creds = readCreds(ownerCredsPath());
    const ownerGymId = await getOwnerGymId(creds.userId);
    const personId = await getPersonIdForUser(creds.userId);
    const { gymId: memberGymId, gymName: memberGymName } = await seedStandaloneGym({
      createdByUserId: creds.userId,
    });
    await seedMembershipForPerson(memberGymId, personId);

    await page.goto("/es/dashboard");
    await expect(page).toHaveURL(/\/es\/dashboard/);

    const opsList = await openIdentityList(page);
    await expect(
      opsList.getByRole("link", { name: new RegExp(`Dueño\\s+${creds.gymName}`) }),
    ).toBeVisible();
    await expect(
      opsList.getByRole("link", { name: new RegExp(`Miembro\\s+${memberGymName}`) }),
    ).toBeVisible();
    await opsList
      .getByRole("link", { name: new RegExp(`Miembro\\s+${memberGymName}`) })
      .click();

    await expect(page).toHaveURL(/\/es\/me(?:\/)?$/, { timeout: 45_000 });
    await expect(page.getByText(memberGymName).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Elegir identidad" })).toHaveText(/Miembro/);

    await page.goto(`/es/context?kind=ops&gymId=${ownerGymId}`);
    await expect(page).toHaveURL(/\/es\/dashboard/, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Resumen diario" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Elegir identidad" })).toHaveText(/Dueño/);
  });
});
