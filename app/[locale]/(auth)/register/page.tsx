import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getProfile, getSessionUser } from "@/lib/auth/session";
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-xl font-semibold">{d.completeSetup.title}</h1>
        <CompleteTenantForm locale={locale} />
        <p className="text-sm text-[var(--color-muted)]">
          <Link href={`/${locale}/login`}>{d.register.loginLink}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">{d.register.title}</h1>
      <RegisterForm locale={locale} />
    </div>
  );
}
