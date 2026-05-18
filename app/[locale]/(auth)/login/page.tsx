import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ registered?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  const sp = await searchParams;
  const banner =
    sp.registered === "pending_confirm" ? d.login.pendingConfirmBanner : null;

  return (
    <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
      <div className="glass-panel animate-fade-in-up w-full max-w-md rounded-2xl p-8 sm:p-10 flex flex-col items-center shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-rose-600 shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{d.login.title}</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Welcome back to your gym workspace</p>
        </div>
        <LoginForm locale={locale} banner={banner} />
      </div>
    </div>
  );
}
