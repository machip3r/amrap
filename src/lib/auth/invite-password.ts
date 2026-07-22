import type { User } from "@supabase/supabase-js";
import { getPersonProfileStatus } from "$lib/auth/profile-onboarding";
import { setRequestUser } from "$lib/auth/session";
import { createClient } from "$lib/supabase/server";

export const AMRAP_NEEDS_INVITE_PASSWORD_KEY = "amrap_needs_invite_password";

/**
 * Whether the signed-in invitee must set a password after accept.
 * New Auth invitees need it; existing accounts (magic-link invite) do not.
 */
export async function userNeedsInvitePassword(user: User): Promise<boolean> {
  // Refresh so invite-time app_metadata is visible for already-signed-in users.
  const supabase = createClient();
  const {
    data: { user: fresh },
  } = await supabase.auth.getUser();
  const u = fresh ?? user;
  if (fresh) setRequestUser(fresh);

  const profile = await getPersonProfileStatus();
  if (profile?.profileCompleted) return false;

  const meta = u.app_metadata as Record<string, unknown> | undefined;
  const flag = meta?.[AMRAP_NEEDS_INVITE_PASSWORD_KEY];
  if (flag === false) return false;
  if (flag === true) return true;

  // Legacy sessions without the flag: only Auth-invite users need a password.
  return Boolean(u.invited_at);
}
