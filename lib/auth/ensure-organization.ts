import { createClient } from "@/lib/supabase/server";
import {
  clearPendingConfirmEmail,
  getPendingOrganizationName,
} from "@/lib/auth/pending-confirm";
import { getOnboardingState } from "@/lib/auth/session";

/**
 * After email confirmation, ensure the organization exists.
 * Uses pending org name cookie, or a safe fallback from email.
 */
export async function ensureOrganizationAfterConfirm(
  email: string,
): Promise<void> {
  const onboarding = await getOnboardingState();
  if (onboarding?.organizationId) {
    await clearPendingConfirmEmail();
    return;
  }

  const pendingName = await getPendingOrganizationName();
  const fallback =
    pendingName ||
    email.split("@")[0]?.slice(0, 80) ||
    "Organization";

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_organization_account", {
    p_organization_name: fallback,
  });
  if (error) {
    console.error("ensureOrganizationAfterConfirm", error.message);
  }
  await clearPendingConfirmEmail();
}
