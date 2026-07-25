import { getRequestEvent } from "$app/server";
import { createClient } from "$lib/supabase/server";
import { getSessionUser } from "$lib/auth/session";
import { getMemberContext } from "$lib/auth/member-session";
import { getWorkspace } from "$lib/auth/session";
import type { Locale } from "$lib/i18n/config";

export type WelcomeRole = "staff" | "trainer" | "member";

export type PersonProfileStatus = {
  personId: string;
  fullName: string | null;
  profileCompleted: boolean;
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
};

function tryLocals() {
  try {
    return getRequestEvent().locals;
  } catch {
    return null;
  }
}

/**
 * Linked person row for the signed-in user (invite / self profile).
 * Memoized on `event.locals` for the duration of one request.
 */
export async function getPersonProfileStatus(): Promise<PersonProfileStatus | null> {
  const locals = tryLocals();
  if (locals?.personProfileResolved) {
    return locals.personProfile ?? null;
  }

  const finish = (status: PersonProfileStatus | null) => {
    if (locals) {
      locals.personProfileResolved = true;
      locals.personProfile = status;
    }
    return status;
  };

  const user = await getSessionUser();
  if (!user) return finish(null);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("persons")
    .select(
      "id, full_name, profile_completed_at, date_of_birth, gender, height_cm, weight_kg",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getPersonProfileStatus", error.message);
    return finish(null);
  }
  if (!data) return finish(null);

  return finish({
    personId: data.id as string,
    fullName: (data.full_name as string | null)?.trim() || null,
    profileCompleted: Boolean(data.profile_completed_at),
    dateOfBirth: (data.date_of_birth as string | null) ?? null,
    gender: (data.gender as string | null) ?? null,
    heightCm:
      data.height_cm != null ? Number(data.height_cm) : null,
    weightKg:
      data.weight_kg != null ? Number(data.weight_kg) : null,
  });
}

/**
 * Whether this signed-in user must finish `/welcome` before app surfaces.
 * Owner org mid-setup uses `/onboarding` instead (handled separately).
 */
export async function needsProfileWelcome(): Promise<boolean> {
  const profile = await getPersonProfileStatus();
  if (!profile || profile.profileCompleted) return false;

  const workspace = await getWorkspace();
  if (workspace) return true;

  const member = await getMemberContext();
  return Boolean(member);
}

/**
 * Which welcome form to show. Ops role wins over member-only fields.
 */
export async function resolveWelcomeRole(): Promise<WelcomeRole | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: roleRow } = await supabase
    .from("gym_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["STAFF", "TRAINER", "OWNER"])
    .or("invite_status.eq.ACCEPTED,role.eq.OWNER")
    .limit(1)
    .maybeSingle();

  if (roleRow?.role === "TRAINER") return "trainer";
  if (roleRow?.role === "STAFF") return "staff";
  if (roleRow?.role === "OWNER") return "staff"; // DOB-only if ever forced

  const member = await getMemberContext();
  if (member) return "member";

  // Accepted/pending membership invite (e.g. not yet ACTIVE) still uses member welcome.
  const { data: person } = await supabase
    .from("persons")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (person) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("person_id", person.id)
      .in("invite_status", ["PENDING", "ACCEPTED"])
      .limit(1)
      .maybeSingle();
    if (membership) return "member";
  }

  return null;
}

export function welcomePath(locale: Locale): string {
  return `/${locale}/welcome`;
}
