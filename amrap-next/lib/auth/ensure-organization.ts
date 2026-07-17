import { createClient } from "@/lib/supabase/server";
import { bootstrapOrganizationAccount } from "@/lib/supabase/admin";
import {
  clearPendingConfirmEmail,
  getPendingOrganizationName,
} from "@/lib/auth/pending-confirm";
import { getOnboardingState, getSessionUser } from "@/lib/auth/session";
import { entityNameSchema } from "@/lib/validation/schemas";

export type EnsureOrganizationResult =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

function resolveOrganizationName(email: string, pendingName: string | null) {
  const rawFallback =
    pendingName || email.split("@")[0]?.slice(0, 80) || "Organization";
  const nameParsed = entityNameSchema.safeParse(rawFallback);
  return nameParsed.success ? nameParsed.data : "Organization";
}

/**
 * After email confirmation, ensure the organization exists.
 * Uses pending org name cookie, or a safe fallback from email.
 */
export async function ensureOrganizationAfterConfirm(
  email: string,
): Promise<EnsureOrganizationResult> {
  const onboarding = await getOnboardingState();
  if (onboarding?.organizationId) {
    await clearPendingConfirmEmail();
    return { ok: true, organizationId: onboarding.organizationId };
  }

  const pendingName = await getPendingOrganizationName();
  const fallback = resolveOrganizationName(email, pendingName);

  const supabase = await createClient();
  const { data: rpcOrgId, error } = await supabase.rpc(
    "register_organization_account",
    { p_organization_name: fallback },
  );

  if (!error && typeof rpcOrgId === "string" && rpcOrgId.length > 0) {
    await clearPendingConfirmEmail();
    return { ok: true, organizationId: rpcOrgId };
  }

  if (error) {
    console.error("ensureOrganizationAfterConfirm rpc", error.message);
  }

  // Fallback when RPC is unavailable or auth.uid() is missing in DB context.
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: error?.message ?? "Not authenticated" };
  }

  const boot = await bootstrapOrganizationAccount(user.id, fallback);
  if (!boot.ok) {
    console.error("ensureOrganizationAfterConfirm bootstrap", boot.message);
    return {
      ok: false,
      error: error?.message ?? boot.message,
    };
  }

  await clearPendingConfirmEmail();
  return { ok: true, organizationId: boot.organizationId };
}
