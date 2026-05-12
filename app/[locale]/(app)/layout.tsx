import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AppNav } from "@/components/app-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { notFound } from "next/navigation";

export default async function AppShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const profile = await getProfile();
  if (!profile) {
    redirect(`/${locale}/complete-setup`);
  }

  const d = getDictionary(locale);

  return (
    <div className="flex min-h-screen">
      <AppNav locale={locale} role={profile.role} />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-muted)]/30 bg-[var(--color-surface)]/50 px-4 py-3">
          <LocaleSwitcher locale={locale} />
          <div className="flex items-center gap-4 text-sm text-[var(--color-muted)]">
            <span>{profile.full_name || profile.id.slice(0, 8)}</span>
            <LogoutButton label={d.nav.logout} locale={locale} />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
