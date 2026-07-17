import type { Locale } from "$lib/i18n/config";
import {
  getOnboardingState,
  getSessionUser,
  getWorkspace,
  type OnboardingState,
} from "$lib/auth/session";
import { getMemberContext } from "$lib/auth/member-session";
import {
  getPendingInvite,
  invitePath,
} from "$lib/auth/invite-decision";
import {
  needsProfileWelcome,
  welcomePath,
} from "$lib/auth/profile-onboarding";
import { createClient } from "$lib/supabase/server";

/**
 * Staff/trainer invitee (pending or accepted). These users must never enter
 * gym-owner onboarding or get an organization bootstrapped.
 */
export async function isInvitedOpsUser(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("gym_roles")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["STAFF", "TRAINER"])
    .in("invite_status", ["pending", "accepted"])
    // Provisional org creators are STAFF + is_provisional_owner; they must
    // finish owner onboarding, not the invitee /welcome path.
    .eq("is_provisional_owner", false)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

/**
 * True when this user created an organization and has not finished owner setup.
 * Invited staff/trainers must never enter gym owner onboarding — their
 * accepted gym_roles row would otherwise look like “gym already created”
 * and dump them on the plans step.
 */
export async function needsOwnerOnboarding(
  onboarding?: OnboardingState | null,
): Promise<boolean> {
  const state = onboarding ?? (await getOnboardingState());
  if (!state?.organizationId || state.completed) return false;
  if (await isInvitedOpsUser()) return false;
  return true;
}

/**
 * Where to send a signed-in user after login, register, invite confirm, etc.
 */
export async function resolvePostAuthPath(locale: Locale): Promise<string> {
  if (await getPendingInvite()) {
    return invitePath(locale);
  }

  if (await needsOwnerOnboarding()) {
    return `/${locale}/onboarding`;
  }

  if (await needsProfileWelcome()) {
    return welcomePath(locale);
  }

  const workspace = await getWorkspace();
  if (workspace) {
    return `/${locale}/dashboard`;
  }

  const member = await getMemberContext();
  if (member) {
    return `/${locale}/me`;
  }

  return `/${locale}/onboarding`;
}
