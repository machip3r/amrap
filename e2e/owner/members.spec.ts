import { test, expect } from "@playwright/test";
import { createMemberViaUi } from "../helpers/auth-ui";
import { uniqueEmail, uniquePersonLabel } from "../helpers/supabase";

test.describe("owner members", () => {
  test("create member, find in list, open detail", async ({ page }) => {
    const memberName = uniquePersonLabel("Miembro");
    const memberEmail = uniqueEmail("e2e.member");

    await createMemberViaUi(page, memberName, memberEmail);

    await page.getByRole("link", { name: new RegExp(memberName) }).first().click();
    await expect(page).toHaveURL(/\/es\/members\/.+/);
    await expect(page.getByText(memberName).first()).toBeVisible();
  });
});
