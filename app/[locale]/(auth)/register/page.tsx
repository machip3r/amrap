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
      <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
        <div className="glass-panel animate-fade-in-up w-full max-w-md rounded-2xl p-8 sm:p-10 flex flex-col items-center shadow-2xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">{d.completeSetup.title}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Just one more step to get started</p>
          </div>
          <CompleteTenantForm locale={locale} />
          <p className="mt-6 text-sm text-[var(--color-muted)] transition-colors hover:text-white">
            <Link href={`/${locale}/login`}>{d.register.loginLink}</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
      <div className="glass-panel animate-fade-in-up w-full max-w-md rounded-2xl p-8 sm:p-10 flex flex-col items-center shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-rose-600 shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{d.register.title}</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Create your gym workspace</p>
        </div>
        <RegisterForm locale={locale} />
      </div>
    </div>
  );
}
