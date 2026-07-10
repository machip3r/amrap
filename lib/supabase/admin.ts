import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Server-only Supabase client with the service role key. Bypasses RLS.
 * Never import this module from client components or expose the key publicly.
 */
function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    return null;
  }
  return createClient(getSupabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Creates tenant + default branch + OWNER profile for a user id.
 * Used when signUp returns a user but no session (email confirmation flow).
 */
export async function bootstrapTenantForUser(
  userId: string,
  tenantName: string,
  fullName: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { ok: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return { ok: true };
  }

  const { data: tenant, error: tErr } = await admin
    .from("tenants")
    .insert({ name: tenantName })
    .select("id")
    .single();

  if (tErr || !tenant) {
    return { ok: false, message: tErr?.message ?? "tenant insert failed" };
  }

  const { error: bErr } = await admin.from("branches").insert({
    tenant_id: tenant.id,
    name: "Principal",
  });

  if (bErr) {
    return { ok: false, message: bErr.message };
  }

  const { error: pErr } = await admin.from("profiles").insert({
    id: userId,
    tenant_id: tenant.id,
    role: "OWNER",
    full_name: fullName ?? "",
  });

  if (pErr) {
    return { ok: false, message: pErr.message };
  }

  return { ok: true };
}
