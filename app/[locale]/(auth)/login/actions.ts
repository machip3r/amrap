"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setPendingConfirmEmail } from "@/lib/auth/pending-confirm";
import { getOnboardingState, getWorkspace } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { z } from "zod";
import {
  emailSchema,
  formString,
  localeSchema,
  loginPasswordSchema,
} from "@/lib/validation/schemas";
import { zodFieldErrors } from "@/lib/validation/field-errors";

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

const loginSchema = z.object({
  locale: localeSchema,
  email: emailSchema,
  password: loginPasswordSchema,
});

function isEmailNotConfirmed(message: string, code?: string): boolean {
  if (code === "email_not_confirmed") return true;
  const m = message.toLowerCase();
  return (
    m.includes("email not confirmed") ||
    m.includes("not confirmed") ||
    m.includes("confirm your email")
  );
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  const locale = localeParsed.success ? localeParsed.data : "es";
  const d = getDictionary(locale);

  const parsed = loginSchema.safeParse({
    locale: localeRaw,
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if (isEmailNotConfirmed(error.message, error.code)) {
      await setPendingConfirmEmail(parsed.data.email);
      redirect(`/${locale}/login`);
    }
    return { error: d.login.error };
  }

  revalidatePath("/", "layout");

  const onboarding = await getOnboardingState();
  if (!onboarding?.organizationId || !onboarding.completed) {
    redirect(`/${locale}/onboarding`);
  }

  const workspace = await getWorkspace();
  if (!workspace) {
    redirect(`/${locale}/onboarding`);
  }

  redirect(`/${locale}/dashboard`);
}
