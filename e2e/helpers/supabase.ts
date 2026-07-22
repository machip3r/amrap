import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getServiceRoleClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url =
    process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "E2E requires PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see e2e/README.md)",
    );
  }

  adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export async function createConfirmedAuthUser(email: string, password: string) {
  const admin = getServiceRoleClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`createUser failed: ${error?.message ?? "no user"}`);
  }
  return data.user;
}

export async function findAuthUserIdByEmail(
  email: string,
): Promise<string | null> {
  const admin = getServiceRoleClient();
  const normalized = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw new Error(`listUsers failed: ${error.message}`);
    }
    const match = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === normalized,
    );
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function confirmAuthUserByEmail(email: string): Promise<void> {
  const userId = await findAuthUserIdByEmail(email);
  if (!userId) {
    throw new Error(`No auth user for ${email}`);
  }
  const admin = getServiceRoleClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (error) {
    throw new Error(`confirm user failed: ${error.message}`);
  }
}

export async function bootstrapOrganizationAccount(
  userId: string,
  organizationName: string,
): Promise<string> {
  const admin = getServiceRoleClient();

  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id")
    .eq("created_by", userId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (existingOrg?.id) {
    return existingOrg.id as string;
  }

  const { data: org, error: oErr } = await admin
    .from("organizations")
    .insert({
      name: organizationName,
      plan_tier: "FREEMIUM",
      created_by: userId,
    })
    .select("id")
    .single();

  if (oErr || !org) {
    throw new Error(`org insert failed: ${oErr?.message ?? "unknown"}`);
  }

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const userEmail = authUser.user?.email ?? null;

  const { error: pErr } = await admin.from("persons").upsert(
    {
      user_id: userId,
      full_name: "",
      email: userEmail,
    },
    { onConflict: "user_id" },
  );

  if (pErr) {
    throw new Error(`persons upsert failed: ${pErr.message}`);
  }

  return org.id as string;
}

export async function deleteAuthUserByEmail(email: string): Promise<void> {
  const userId = await findAuthUserIdByEmail(email);
  if (!userId) return;
  const admin = getServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`deleteUser failed: ${error.message}`);
  }
}

/**
 * Hard-delete E2E tenant data for a seeded/registered user, then the auth user.
 *
 * Cascade chain (DB): organization → gyms → branches (+ gym-scoped rows).
 * Auth delete alone does **not** remove orgs/gyms (`created_by` / `owner_user_id` are SET NULL).
 *
 * Safety: only hard-deletes organizations whose name starts with `E2E `.
 */
export async function cleanupE2eUserByEmail(email: string): Promise<void> {
  const admin = getServiceRoleClient();
  const userId = await findAuthUserIdByEmail(email);
  if (!userId) return;

  const { data: orgs, error: orgErr } = await admin
    .from("organizations")
    .select("id, name")
    .eq("created_by", userId);

  if (orgErr) {
    throw new Error(`list orgs for cleanup failed: ${orgErr.message}`);
  }

  const e2eOrgs = (orgs ?? []).filter((o) =>
    String(o.name ?? "").startsWith("E2E "),
  );
  const orgIds = e2eOrgs.map((o) => o.id as string);

  const relatedUserIds = new Set<string>();
  const memberPersonIds = new Set<string>();

  if (orgIds.length > 0) {
    const { data: gyms, error: gymErr } = await admin
      .from("gyms")
      .select("id")
      .in("organization_id", orgIds);

    if (gymErr) {
      throw new Error(`list gyms for cleanup failed: ${gymErr.message}`);
    }

    const gymIds = (gyms ?? []).map((g) => g.id as string);

    if (gymIds.length > 0) {
      const { data: roles, error: roleErr } = await admin
        .from("gym_roles")
        .select("user_id")
        .in("gym_id", gymIds);

      if (roleErr) {
        throw new Error(`list gym_roles for cleanup failed: ${roleErr.message}`);
      }
      for (const row of roles ?? []) {
        if (row.user_id && row.user_id !== userId) {
          relatedUserIds.add(row.user_id as string);
        }
      }

      const { data: memberships, error: memErr } = await admin
        .from("memberships")
        .select("person_id")
        .in("gym_id", gymIds);

      if (memErr) {
        throw new Error(
          `list memberships for cleanup failed: ${memErr.message}`,
        );
      }
      for (const row of memberships ?? []) {
        if (row.person_id) memberPersonIds.add(row.person_id as string);
      }
    }

    const { error: delOrgErr } = await admin
      .from("organizations")
      .delete()
      .in("id", orgIds);

    if (delOrgErr) {
      throw new Error(`delete organizations failed: ${delOrgErr.message}`);
    }
  }

  // Unclaimed member persons are not removed by gym cascade (memberships go, persons remain).
  if (memberPersonIds.size > 0) {
    const ids = [...memberPersonIds];
    const { data: persons, error: personErr } = await admin
      .from("persons")
      .select("id, user_id")
      .in("id", ids);

    if (personErr) {
      throw new Error(`list persons for cleanup failed: ${personErr.message}`);
    }

    const orphanPersonIds = (persons ?? [])
      .filter((p) => !p.user_id || p.user_id === userId)
      .map((p) => p.id as string);

    for (const p of persons ?? []) {
      if (p.user_id && p.user_id !== userId) {
        relatedUserIds.add(p.user_id as string);
      }
    }

    if (orphanPersonIds.length > 0) {
      const { error: delPersonErr } = await admin
        .from("persons")
        .delete()
        .in("id", orphanPersonIds);

      if (delPersonErr) {
        throw new Error(`delete persons failed: ${delPersonErr.message}`);
      }
    }
  }

  for (const relatedId of relatedUserIds) {
    const { error } = await admin.auth.admin.deleteUser(relatedId);
    if (error) {
      console.warn("E2E cleanup: related auth user", relatedId, error.message);
    }
  }

  const { error: delOwnerErr } = await admin.auth.admin.deleteUser(userId);
  if (delOwnerErr) {
    throw new Error(`deleteUser failed: ${delOwnerErr.message}`);
  }
}

/** Domain must not be a reserved example/test host — Supabase Auth rejects those. */
const E2E_EMAIL_DOMAIN =
  process.env.E2E_EMAIL_DOMAIN?.trim() || "amrap-e2e.com";

export function uniqueEmail(prefix: string): string {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return `${prefix}.${stamp}@${E2E_EMAIL_DOMAIN}`;
}

/** Person names cannot include digits (sanitizePersonNameInput / personNameSchema). */
export function uniquePersonLabel(prefix: string): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let n = Date.now() + Math.floor(Math.random() * 1e6);
  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    suffix = alphabet[n % 26]! + suffix;
    n = Math.floor(n / 26);
  }
  return `${prefix} ${suffix}`;
}

export const E2E_PASSWORD = "AmrapE2ePass1!";

/** Active OWNER gym for a seeded E2E owner user. */
export async function getOwnerGymId(ownerUserId: string): Promise<string> {
  const admin = getServiceRoleClient();
  const { data, error } = await admin
    .from("gym_roles")
    .select("gym_id")
    .eq("user_id", ownerUserId)
    .eq("role", "OWNER")
    .limit(1)
    .maybeSingle();

  if (error || !data?.gym_id) {
    throw new Error(
      `getOwnerGymId failed: ${error?.message ?? "no OWNER gym_role"}`,
    );
  }
  return data.gym_id as string;
}

export type SeededGymUser = {
  email: string;
  password: string;
  userId: string;
  fullName: string;
  personId: string;
};

/** Confirmed auth user + person + accepted STAFF/TRAINER role at gym. */
export async function seedAcceptedGymRoleUser(
  gymId: string,
  role: "STAFF" | "TRAINER" = "STAFF",
): Promise<SeededGymUser> {
  const admin = getServiceRoleClient();
  const email = uniqueEmail(role === "TRAINER" ? "e2e.trainer.fb" : "e2e.staff.fb");
  const fullName = uniquePersonLabel(role === "TRAINER" ? "Entrenador" : "Staff");
  const user = await createConfirmedAuthUser(email, E2E_PASSWORD);

  const { data: person, error: personErr } = await admin
    .from("persons")
    .upsert(
      {
        user_id: user.id,
        full_name: fullName,
        email,
        profile_completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (personErr || !person?.id) {
    throw new Error(
      `seed staff person failed: ${personErr?.message ?? "no person"}`,
    );
  }

  const { error: roleErr } = await admin.from("gym_roles").insert({
    gym_id: gymId,
    user_id: user.id,
    role,
    invite_status: "accepted",
  });

  if (roleErr) {
    throw new Error(`seed gym_roles failed: ${roleErr.message}`);
  }

  return {
    email,
    password: E2E_PASSWORD,
    userId: user.id,
    fullName,
    personId: person.id as string,
  };
}

/** Confirmed auth user + person + accepted ACTIVE membership at gym. */
export async function seedAcceptedMemberUser(
  gymId: string,
): Promise<SeededGymUser> {
  const admin = getServiceRoleClient();
  const email = uniqueEmail("e2e.member.fb");
  const fullName = uniquePersonLabel("MiembroFb");
  const user = await createConfirmedAuthUser(email, E2E_PASSWORD);

  const { data: person, error: personErr } = await admin
    .from("persons")
    .insert({
      user_id: user.id,
      full_name: fullName,
      email,
      profile_completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (personErr || !person?.id) {
    throw new Error(
      `seed member person failed: ${personErr?.message ?? "no person"}`,
    );
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error: memErr } = await admin.from("memberships").insert({
    gym_id: gymId,
    person_id: person.id,
    status: "ACTIVE",
    invite_status: "accepted",
    expires_at: expiresAt,
  });

  if (memErr) {
    throw new Error(`seed membership failed: ${memErr.message}`);
  }

  return {
    email,
    password: E2E_PASSWORD,
    userId: user.id,
    fullName,
    personId: person.id as string,
  };
}

export async function seedGymFeedbackMessage(options: {
  gymId: string;
  body: string;
  authorPersonId?: string | null;
  target?: "gym" | "amrap";
}): Promise<string> {
  const admin = getServiceRoleClient();
  const { data, error } = await admin
    .from("feedback_messages")
    .insert({
      gym_id: options.gymId,
      body: options.body,
      target: options.target ?? "gym",
      author_person_id: options.authorPersonId ?? null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(
      `seed feedback_messages failed: ${error?.message ?? "no id"}`,
    );
  }
  return data.id as string;
}
