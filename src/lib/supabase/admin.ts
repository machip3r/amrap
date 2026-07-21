import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from '$lib/supabase/env';

function getServiceRoleKey(): string | undefined {
	return (
		SUPABASE_SERVICE_ROLE_KEY?.trim() ||
		(typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() : undefined) ||
		undefined
	);
}

/**
 * Server-only Supabase client with the service role key. Bypasses RLS.
 * Never import this module from client components or expose the key publicly.
 */
export function createServiceRoleClient() {
	const key = getServiceRoleKey();
	if (!key) {
		return null;
	}
	return createClient(getSupabaseUrl(), key, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}

/**
 * Creates organization + person for a user id (no gym yet).
 * Used when signUp returns a user but no session (email confirmation flow).
 */
export async function bootstrapOrganizationAccount(
  userId: string,
  organizationName: string,
): Promise<
  { ok: true; organizationId: string } | { ok: false; message: string }
> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { ok: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id")
    .eq("created_by", userId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (existingOrg) {
    return { ok: true, organizationId: existingOrg.id };
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
    return { ok: false, message: oErr?.message ?? "organization insert failed" };
  }

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const email = authUser.user?.email ?? null;

  const { error: pErr } = await admin.from("persons").upsert(
    {
      user_id: userId,
      full_name: "",
      email,
    },
    { onConflict: "user_id" },
  );

  if (pErr) {
    return { ok: false, message: pErr.message };
  }

  return { ok: true, organizationId: org.id };
}
