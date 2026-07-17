import { getRequestEvent } from '$app/server';
import { createClient } from '$lib/supabase/server';
import { parseBrandThemeTokens } from "$lib/branding/theme";
import { gymLogoPublicUrl } from "$lib/branding/logo";
import { parseHiddenNavIds } from "$lib/nav/ops-nav";
import type { BrandThemeTokens, OrgPlanTier, Profile, Role, Workspace } from "$lib/types";

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
  nav_visibility: unknown;
  gyms:
    | {
        id: string;
        name: string;
        organization_id: string;
        logo_url_light: string | null;
        logo_url_dark: string | null;
        updated_at: string | null;
        theme_light: unknown;
        theme_dark: unknown;
        organizations: {
          id: string;
          name: string;
          plan_tier: OrgPlanTier;
        } | null;
      }
    | {
        id: string;
        name: string;
        organization_id: string;
        logo_url_light: string | null;
        logo_url_dark: string | null;
        updated_at: string | null;
        theme_light: unknown;
        theme_dark: unknown;
        organizations: {
          id: string;
          name: string;
          plan_tier: OrgPlanTier;
        } | null;
      }[]
    | null;
};

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toWorkspace(
  userId: string,
  personId: string,
  fullName: string | null,
  row: GymRoleRow,
): Workspace {
  const gym = firstEmbed(row.gyms);
  const org = firstEmbed(gym?.organizations ?? null);
  const isProvisionalOwner = row.is_provisional_owner;
  const role = row.role;
  const themeLight: BrandThemeTokens = parseBrandThemeTokens(gym?.theme_light);
  const themeDark: BrandThemeTokens = parseBrandThemeTokens(gym?.theme_dark);
  const cacheKey = gym?.updated_at ?? null;
  const lightPath = gym?.logo_url_light ?? gym?.logo_url_dark ?? null;
  const darkPath = gym?.logo_url_dark ?? gym?.logo_url_light ?? null;
  return {
    userId,
    personId,
    fullName,
    organizationId: org?.id ?? gym?.organization_id ?? "",
    organizationName: org?.name ?? "",
    planTier: org?.plan_tier ?? "FREEMIUM",
    gymId: row.gym_id,
    gymName: gym?.name ?? "",
    logoUrlLight: gymLogoPublicUrl(lightPath, cacheKey),
    logoUrlDark: gymLogoPublicUrl(darkPath, cacheKey),
    themeLight,
    themeDark,
    hiddenNavIds: parseHiddenNavIds(row.nav_visibility),
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
      invite_status,
      nav_visibility,
      gyms (
        id,
        name,
        organization_id,
        logo_url_light,
        logo_url_dark,
        updated_at,
        theme_light,
        theme_dark,
        organizations (
          id,
          name,
          plan_tier
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .or("invite_status.eq.accepted,role.eq.OWNER");

  if (error || !roles?.length) return null;

  const rows = roles as unknown as GymRoleRow[];
  const preferred = getRequestEvent().cookies.get(ACTIVE_GYM_COOKIE);
  const selected =
    (preferred && rows.find((r) => r.gym_id === preferred)) || rows[0];

  if (!selected?.gyms) return null;

  const workspace = toWorkspace(
    user.id,
    person?.id ?? "",
    person?.full_name ?? null,
    selected,
  );

  // Always resolve logos from the gym row (more reliable than nested embeds).
  const { data: gymRow } = await supabase
    .from("gyms")
    .select("logo_url_light, logo_url_dark, updated_at")
    .eq("id", workspace.gymId)
    .maybeSingle();
  if (gymRow) {
    const cacheKey = gymRow.updated_at ?? null;
    const lightPath = gymRow.logo_url_light ?? gymRow.logo_url_dark ?? null;
    const darkPath = gymRow.logo_url_dark ?? gymRow.logo_url_light ?? null;
    workspace.logoUrlLight = gymLogoPublicUrl(lightPath, cacheKey);
    workspace.logoUrlDark = gymLogoPublicUrl(darkPath, cacheKey);
  }

  return workspace;
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

  const { data: orgRows, error: orgError } = await supabase
    .from("organizations")
    .select(
      "id, name, pending_as_provisional, onboarding_plans_done, onboarding_completed_at",
    )
    .eq("created_by", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1);
  if (orgError) {
    console.error("getOnboardingState organizations", orgError.message);
  }
  const org = orgRows?.[0] ?? null;

  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (personError) {
    console.error("getOnboardingState persons", personError.message);
  }

  const { data: roleRows, error: roleError } = await supabase
    .from("gym_roles")
    .select("gym_id, gyms ( id, name )")
    .eq("user_id", user.id)
    .or("role.eq.OWNER,is_provisional_owner.eq.true")
    .limit(1);
  if (roleError) {
    console.error("getOnboardingState gym_roles", roleError.message);
  }
  const role = roleRows?.[0] ?? null;

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
