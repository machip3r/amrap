import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

/** Cookie storing the member's preferred active gym (distinct from staff ACTIVE_GYM_COOKIE). */
export const MEMBER_GYM_COOKIE = "amrap_member_gym_id";

export type MemberGym = {
  gymId: string;
  gymName: string;
  membershipId: string;
  expiresAt: string;
};

export type MemberContext = {
  userId: string;
  personId: string;
  fullName: string | null;
  qrCode: string;
  gyms: MemberGym[];
  activeGymId: string;
};

type GymEmbed = { id: string; name: string };

type MembershipRow = {
  id: string;
  gym_id: string;
  expires_at: string;
  gyms: GymEmbed | GymEmbed[] | null;
};

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Resolves the signed-in user's member identity: linked `persons` row plus
 * active memberships (gyms they currently train at). Returns null when the
 * user has no linked person or no active membership anywhere.
 */
export async function getMemberContext(): Promise<MemberContext | null> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("id, full_name, qr_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (personError) {
    console.error("getMemberContext person", personError.message);
  }
  if (!person) return null;

  const nowIso = new Date().toISOString();
  const { data: memberships, error: membershipsError } = await supabase
    .from("memberships")
    .select("id, gym_id, expires_at, gyms ( id, name )")
    .eq("person_id", person.id)
    .eq("status", "ACTIVE")
    .eq("invite_status", "accepted")
    .gte("expires_at", nowIso)
    .order("expires_at", { ascending: false });

  if (membershipsError) {
    console.error("getMemberContext memberships", membershipsError.message);
  }

  const rows = (memberships ?? []) as unknown as MembershipRow[];
  const gyms = rows
    .map((row) => {
      const gym = firstEmbed(row.gyms);
      if (!gym) return null;
      return {
        gymId: row.gym_id,
        gymName: gym.name,
        membershipId: row.id,
        expiresAt: row.expires_at,
      } satisfies MemberGym;
    })
    .filter((g): g is MemberGym => g !== null);

  if (gyms.length === 0) return null;

  const cookieStore = await cookies();
  const preferred = cookieStore.get(MEMBER_GYM_COOKIE)?.value;
  const active =
    (preferred && gyms.find((g) => g.gymId === preferred)) || gyms[0]!;

  return {
    userId: user.id,
    personId: person.id,
    fullName: person.full_name ?? null,
    qrCode: person.qr_code,
    gyms,
    activeGymId: active.gymId,
  };
}
