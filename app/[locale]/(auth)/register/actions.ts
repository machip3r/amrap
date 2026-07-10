"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bootstrapTenantForUser } from "@/lib/supabase/admin";
import { getSessionUser, getProfile } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { headers } from "next/headers";
import { z } from "zod";
import {
  emailSchema,
  formString,
  localeSchema,
  nonEmptyString,
  optionalTrimmed,
  passwordSchema,
} from "@/lib/validation/schemas";

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

const registerSchema = z
  .object({
    locale: localeSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    tenantName: nonEmptyString(120),
    fullName: optionalTrimmed(120),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  const locale = localeParsed.success ? localeParsed.data : "es";
  const d = getDictionary(locale);

  const parsed = registerSchema.safeParse({
    locale: localeRaw,
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
    tenantName: formString(formData, "tenantName"),
    fullName: formString(formData, "fullName"),
  });

  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.message === "mismatch")) {
      return { error: d.register.passwordMismatch };
    }
    return { error: d.common.invalidInput };
  }

  const { email, password, tenantName, fullName } = parsed.data;

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/${locale}/dashboard`,
    },
  });

  if (error) {
    console.error("registerAction signUp", error.message);
    if (looksLikeEmailAlreadyRegistered(error.message)) {
      return { error: d.register.emailInUse };
    }
    return { error: d.register.error };
  }

  if (!data.user) {
    return { error: d.register.error };
  }

  if (!data.session) {
    const boot = await bootstrapTenantForUser(data.user.id, tenantName, fullName);
    if (boot.ok) {
      revalidatePath("/", "layout");
      redirect(`/${locale}/login?registered=pending_confirm`);
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { error: d.register.confirmEmail };
    }
    console.error("registerAction bootstrap", boot.message);
    return { error: d.register.rpcFailed };
  }

  const { error: rpcError } = await supabase.rpc("register_tenant", {
    p_tenant_name: tenantName,
    p_full_name: fullName,
  });

  if (rpcError) {
    console.error("registerAction rpc", rpcError.message);
    return { error: d.register.rpcFailed };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}

const completeSchema = z.object({
  locale: localeSchema,
  tenantName: nonEmptyString(120),
  fullName: optionalTrimmed(120),
});

export async function completeTenantAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  const locale = localeParsed.success ? localeParsed.data : "es";
  const d = getDictionary(locale);

  const parsed = completeSchema.safeParse({
    locale: localeRaw,
    tenantName: formString(formData, "tenantName"),
    fullName: formString(formData, "fullName"),
  });
  if (!parsed.success) return { error: d.common.invalidInput };

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
    p_tenant_name: parsed.data.tenantName,
    p_full_name: parsed.data.fullName,
  });

  if (rpcError) {
    console.error("completeTenantAction", rpcError.message);
    return { error: d.completeSetup.error };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}
