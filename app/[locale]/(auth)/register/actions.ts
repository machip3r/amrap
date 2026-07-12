"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRequestOrigin } from "@/lib/http/origin";
import { createClient } from "@/lib/supabase/server";
import { bootstrapOrganizationAccount } from "@/lib/supabase/admin";
import { setPendingConfirmSignup } from "@/lib/auth/pending-confirm";
import { getSessionUser, getWorkspace } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { z } from "zod";
import {
  emailSchema,
  entityNameSchema,
  formString,
  localeSchema,
  passwordSchema,
} from "@/lib/validation/schemas";
import { zodFieldErrors } from "@/lib/validation/field-errors";

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

function looksLikeEmailAlreadyRegistered(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("already been registered") ||
    m.includes("already registered") ||
    m.includes("user already registered") ||
    m.includes("email address is already")
  );
}

function looksLikeEmailRateLimited(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("email rate limit exceeded") ||
    m.includes("only request this after") ||
    m.includes("too many requests")
  );
}

const registerSchema = z
  .object({
    locale: localeSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    organizationName: entityNameSchema,
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
    organizationName: formString(formData, "organizationName"),
  });

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
  }

  const { email, password, organizationName } = parsed.data;

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/${locale}/onboarding`,
    },
  });

  if (error) {
    console.error("registerAction signUp", error.message);
    if (looksLikeEmailAlreadyRegistered(error.message)) {
      return { error: d.register.emailInUse };
    }
    if (looksLikeEmailRateLimited(error.message)) {
      return { error: d.register.emailRateLimited };
    }
    return { error: d.register.error };
  }

  if (!data.user) {
    return { error: d.register.error };
  }

  // Email confirmation required (no session yet) → always show OTP UI
  if (!data.session) {
    const boot = await bootstrapOrganizationAccount(
      data.user.id,
      organizationName,
    );
    if (!boot.ok) {
      // Org will be created after OTP when the user has a session
      console.warn("registerAction bootstrap deferred", boot.message);
    }

    await setPendingConfirmSignup({ email, organizationName });
    revalidatePath("/", "layout");
    redirect(`/${locale}/register`);
  }

  const { error: rpcError } = await supabase.rpc(
    "register_organization_account",
    {
      p_organization_name: organizationName,
    },
  );

  if (rpcError) {
    console.error("registerAction rpc", rpcError.message);
    return { error: d.register.rpcFailed };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/onboarding`);
}

/** Ensures a logged-in user without org can still start onboarding. */
export async function ensureOrganizationAction(
  organizationName: string,
): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "auth" };

  const nameParsed = entityNameSchema.safeParse(organizationName);
  if (!nameParsed.success) return { error: "invalid" };

  const ws = await getWorkspace();
  if (ws) return {};

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_organization_account", {
    p_organization_name: nameParsed.data,
  });
  if (error) {
    console.error("ensureOrganizationAction", error.message);
    return { error: error.message };
  }
  return {};
}
