import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { OrgPlanTier, Profile, Role, Workspace } from "@/types";

export const ACTIVE_GYM_COOKIE = "amrap_gym_id";

export type OnboardingStep = 1 | 2 | 3 | 4;

export type OnboardingState = {
  userId: string;
  organizationId: string | null;
  organizationName: string | null;
  personId: string | null;
  fullName: string | null;
  pendingAsProvisional: boolean;
  hasGym: boolean;
  gymId: string | null;
  gymName: string | null;
  completed: boolean;
  /** Next step the user should see (1–4). */
  step: OnboardingStep;
};

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

type GymRoleRow = {
  id: string;
  gym_id: string;
  role: Role;
  is_provisional_owner: boolean;
  gyms: {
    id: string;
    name: string;
    organization_id: string;
    organizations: {
      id: string;
      name: string;
      plan_tier: OrgPlanTier;
    } | null;
  } | null;
};

function toWorkspace(
  userId: string,
  personId: string,
  fullName: string | null,
  row: GymRoleRow,
): Workspace {
  const gym = row.gyms;
  const org = gym?.organizations;
  const isProvisionalOwner = row.is_provisional_owner;
  const role = row.role;
  return {
    userId,
    personId,
    fullName,
    organizationId: org?.id ?? gym?.organization_id ?? "",
    organizationName: org?.name ?? "",
    planTier: org?.plan_tier ?? "FREEMIUM",
    gymId: row.gym_id,
    gymName: gym?.name ?? "",
    role,
    isProvisionalOwner,
    canActAsOwner: role === "OWNER" || isProvisionalOwner,
  };
}

function asProfile(ws: Workspace): Profile {
  return {
    ...ws,
    id: ws.userId,
    tenant_id: ws.gymId,
    full_name: ws.fullName,
  };
}

/**
 * Resolves the signed-in user's active gym workspace (cookie or first role).
 */
export async function getWorkspace(): Promise<Workspace | null> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data: person } = await supabase
    .from("persons")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: roles, error } = await supabase
    .from("gym_roles")
    .select(
      `
      id,
      gym_id,
      role,
      is_provisional_owner,
      gyms (
        id,
        name,
        organization_id,
        organizations (
          id,
          name,
          plan_tier
        )
      )
    `,
    )
    .eq("user_id", user.id);

  if (error || !roles?.length) return null;

  const rows = roles as unknown as GymRoleRow[];
  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_GYM_COOKIE)?.value;
  const selected =
    (preferred && rows.find((r) => r.gym_id === preferred)) || rows[0];

  if (!selected?.gyms) return null;

  return toWorkspace(
    user.id,
    person?.id ?? "",
    person?.full_name ?? null,
    selected,
  );
}

/** @deprecated Use getWorkspace — returns Profile-shaped workspace for existing callers. */
export async function getProfile(): Promise<Profile | null> {
  const ws = await getWorkspace();
  if (!ws) return null;
  return asProfile(ws);
}

export async function getOnboardingState(): Promise<OnboardingState | null> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "id, name, pending_as_provisional, onboarding_plans_done, onboarding_completed_at",
    )
    .eq("created_by", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: person } = await supabase
    .from("persons")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: role } = await supabase
    .from("gym_roles")
    .select("gym_id, gyms ( id, name )")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const gyms = role?.gyms as unknown as { id: string; name: string } | null;
  const hasGym = Boolean(role?.gym_id);
  const fullName = person?.full_name?.trim() || null;
  const plansDone = Boolean(org?.onboarding_plans_done);
  const completed = Boolean(org?.onboarding_completed_at);

  let step: OnboardingStep = 1;
  if (!org || !fullName) {
    step = 1;
  } else if (!hasGym) {
    step = 2;
  } else if (!plansDone) {
    step = 3;
  } else if (!completed) {
    step = 4;
  } else {
    step = 4;
  }

  return {
    userId: user.id,
    organizationId: org?.id ?? null,
    organizationName: org?.name ?? null,
    personId: person?.id ?? null,
    fullName,
    pendingAsProvisional: org?.pending_as_provisional ?? false,
    hasGym,
    gymId: role?.gym_id ?? gyms?.id ?? null,
    gymName: gyms?.name ?? null,
    completed,
    step,
  };
}

export async function listUserGymRoles(): Promise<
  { gymId: string; gymName: string; role: Role }[]
> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return [];

  const { data } = await supabase
    .from("gym_roles")
    .select("gym_id, role, gyms ( name )")
    .eq("user_id", user.id);

  if (!data) return [];

  return data.map((r) => {
    const gyms = r.gyms as unknown as { name: string } | null;
    return {
      gymId: r.gym_id as string,
      gymName: gyms?.name ?? "",
      role: r.role as Role,
    };
  });
}
