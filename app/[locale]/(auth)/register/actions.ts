"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bootstrapTenantForUser } from "@/lib/supabase/admin";
import { getSessionUser, getProfile } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export type RegisterState = { error?: string } | null;

function looksLikeEmailAlreadyRegistered(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("already been registered") ||
    m.includes("already registered") ||
    m.includes("user already registered") ||
    m.includes("email address is already")
  );
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const localeRaw = String(formData.get("locale") ?? "es");
  const locale = isLocale(localeRaw) ? localeRaw : "es";
  const d = getDictionary(locale);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!tenantName || !email || !password) {
    return { error: d.register.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (looksLikeEmailAlreadyRegistered(error.message)) {
      return { error: d.register.emailInUse };
    }
    return { error: `${d.register.error}: ${error.message}` };
  }

  if (!data.user) {
    return { error: d.register.error };
  }

  if (!data.session) {
    const boot = await bootstrapTenantForUser(data.user.id, tenantName, fullName || null);
    if (boot.ok) {
      revalidatePath("/", "layout");
      redirect(`/${locale}/login?registered=pending_confirm`);
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { error: d.register.confirmEmail };
    }
    return { error: `${d.register.rpcFailed}: ${boot.message}` };
  }

  const { error: rpcError } = await supabase.rpc("register_tenant", {
    p_tenant_name: tenantName,
    p_full_name: fullName || null,
  });

  if (rpcError) {
    return { error: `${d.register.rpcFailed}: ${rpcError.message}` };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}

export async function completeTenantAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const localeRaw = String(formData.get("locale") ?? "es");
  const locale = isLocale(localeRaw) ? localeRaw : "es";
  const d = getDictionary(locale);

  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!tenantName) {
    return { error: d.completeSetup.error };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: d.register.error };
  }

  const existing = await getProfile();
  if (existing) {
    redirect(`/${locale}/dashboard`);
  }

  const supabase = await createClient();
  const { error: rpcError } = await supabase.rpc("register_tenant", {
    p_tenant_name: tenantName,
    p_full_name: fullName || null,
  });

  if (rpcError) {
    return { error: `${d.register.rpcFailed}: ${rpcError.message}` };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}
