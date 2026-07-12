"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getRequestOrigin } from "@/lib/http/origin";
import {
  clearPendingConfirmEmail,
  setPendingConfirmEmail,
} from "@/lib/auth/pending-confirm";
import { ensureOrganizationAfterConfirm } from "@/lib/auth/ensure-organization";
import { getOnboardingState, getWorkspace } from "@/lib/auth/session";
import {
  emailSchema,
  formString,
  localeSchema,
  otpSchema,
} from "@/lib/validation/schemas";
import { zodFieldErrors } from "@/lib/validation/field-errors";
import { z } from "zod";

export type ConfirmEmailState = {
  error?: string;
  success?: string;
  email?: string;
  fieldErrors?: Record<string, string>;
} | null;

const verifySchema = z.object({
  locale: localeSchema,
  email: emailSchema,
  otp: otpSchema,
});

const resendSchema = z.object({
  locale: localeSchema,
  email: emailSchema,
});

function localeFrom(formData: FormData) {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  return localeParsed.success ? localeParsed.data : ("es" as const);
}

function isRateLimited(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("only request this after") ||
    m.includes("security purposes") ||
    m.includes("too many requests")
  );
}

async function redirectAfterAuth(locale: string) {
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

export async function verifySignupOtpAction(
  _prev: ConfirmEmailState,
  formData: FormData,
): Promise<ConfirmEmailState> {
  const locale = localeFrom(formData);
  const d = getDictionary(locale);

  const parsed = verifySchema.safeParse({
    locale: formString(formData, "locale") || "es",
    email: formString(formData, "email"),
    otp: formString(formData, "otp"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: zodFieldErrors(parsed.error, d.validation),
      email: formString(formData, "email") || undefined,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.otp,
    type: "signup",
  });

  if (error) {
    console.error("verifySignupOtpAction", error.message);
    return {
      fieldErrors: { otp: d.confirmEmail.invalidOtp },
      email: parsed.data.email,
    };
  }

  await ensureOrganizationAfterConfirm(parsed.data.email);
  revalidatePath("/", "layout");
  await redirectAfterAuth(locale);
  return null;
}

export async function resendSignupOtpAction(
  _prev: ConfirmEmailState,
  formData: FormData,
): Promise<ConfirmEmailState> {
  const locale = localeFrom(formData);
  const d = getDictionary(locale);

  const parsed = resendSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    email: formString(formData, "email"),
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
  }

  const origin = await getRequestOrigin();
  const redirectTo = `${origin}/auth/confirm?next=/${locale}/onboarding`;
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    console.error("resendSignupOtpAction", error.message, { redirectTo });
    if (isRateLimited(error.message)) {
      return {
        error: d.confirmEmail.resendRateLimited,
        email: parsed.data.email,
      };
    }
    return {
      error: d.confirmEmail.resendFailed,
      email: parsed.data.email,
    };
  }

  await setPendingConfirmEmail(parsed.data.email);
  return {
    success: d.confirmEmail.resendOk,
    email: parsed.data.email,
  };
}

export async function clearPendingConfirmAction(
  formData: FormData,
): Promise<void> {
  const locale = localeFrom(formData);
  await clearPendingConfirmEmail();
  revalidatePath("/", "layout");
  const from = formString(formData, "from");
  if (from === "login") {
    redirect(`/${locale}/login`);
  }
  redirect(`/${locale}/register`);
}
