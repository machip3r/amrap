import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { AmrapLogo } from "@/components/landing/amrap-logo";
import { RegisterForm } from "./register-form";
import { CompleteTenantForm } from "./complete-tenant-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  const profile = await getProfile();
  if (profile) {
    redirect(`/${locale}/dashboard`);
  }

  const user = await getSessionUser();

  if (user) {
    return (
      <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
        <div className="glass-panel animate-fade-in-up flex w-full max-w-md flex-col items-center rounded-2xl p-8 shadow-2xl sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex w-full justify-center">
              <AmrapLogo priority className="h-14 w-auto sm:h-16" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {d.completeSetup.title}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {d.completeSetup.description}
            </p>
          </div>
          <CompleteTenantForm locale={locale} />
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            <Link
              href={`/${locale}/login`}
              className="transition-colors hover:text-[var(--color-primary)]"
            >
              {d.register.loginLink}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
      <div className="glass-panel animate-fade-in-up flex w-full max-w-md flex-col items-center rounded-2xl p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex w-full justify-center">
            <AmrapLogo priority className="h-14 w-auto sm:h-16" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {d.register.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{d.register.subtitle}</p>
        </div>
        <RegisterForm locale={locale} />
      </div>
    </div>
  );
}
