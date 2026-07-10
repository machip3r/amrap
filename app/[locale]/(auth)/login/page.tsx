import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import { AmrapLogo } from "@/components/landing/amrap-logo";
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
      <div className="glass-panel animate-fade-in-up flex w-full max-w-md flex-col items-center rounded-2xl p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex w-full justify-center">
            <AmrapLogo priority className="h-14 w-auto sm:h-16" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {d.login.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{d.login.subtitle}</p>
        </div>
        <LoginForm locale={locale} banner={banner} />
      </div>
    </div>
  );
}
