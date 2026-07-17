import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getServiceRoleClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url =
    process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "E2E requires PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (see e2e/README.md)",
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
  await admin.auth.admin.deleteUser(userId);
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
