import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  getOnboardingState,
  getSessionUser,
  getWorkspace,
} from "@/lib/auth/session";
import { getPendingConfirmEmail } from "@/lib/auth/pending-confirm";
import { AmrapLogo } from "@/components/landing/amrap-logo";
import { ConfirmEmailForm } from "@/components/auth/confirm-email-form";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  const workspace = await getWorkspace();
  if (workspace) {
    const onboarding = await getOnboardingState();
    if (onboarding && !onboarding.completed) {
      redirect(`/${locale}/onboarding`);
    }
    redirect(`/${locale}/dashboard`);
  }

  const user = await getSessionUser();
  if (user) {
    redirect(`/${locale}/onboarding`);
  }

  const pendingEmail = await getPendingConfirmEmail();
  const showConfirm = Boolean(pendingEmail);

  return (
    <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
      <div className="glass-panel animate-fade-in-up flex w-full max-w-md flex-col items-center rounded-2xl p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex w-full justify-center">
            <Link href={`/${locale}`} aria-label="AMRAP">
              <AmrapLogo priority className="h-14 w-auto sm:h-16" />
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {showConfirm ? d.confirmEmail.title : d.register.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {showConfirm ? d.confirmEmail.subtitle : d.register.subtitle}
          </p>
        </div>
        {showConfirm && pendingEmail ? (
          <ConfirmEmailForm locale={locale} email={pendingEmail} />
        ) : (
          <RegisterForm locale={locale} />
        )}
      </div>
    </div>
  );
}
