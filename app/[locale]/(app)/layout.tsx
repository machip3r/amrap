import { redirect } from "next/navigation";
import { getOnboardingState, getWorkspace } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AppNav } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { notFound } from "next/navigation";
import { Search, Bell, HelpCircle } from "lucide-react";
import { LIMITS } from "@/lib/validation/schemas";

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

  const onboarding = await getOnboardingState();
  if (!onboarding?.completed) {
    redirect(`/${locale}/onboarding`);
  }

  const workspace = await getWorkspace();
  if (!workspace) {
    redirect(`/${locale}/onboarding`);
  }

  const d = getDictionary(locale);
  const initial =
    workspace.fullName?.charAt(0).toUpperCase() ||
    workspace.userId.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <AppNav locale={locale} role={workspace.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
          <div className="flex flex-1 items-center">
            <div className="relative w-full max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-[var(--color-muted)]" aria-hidden />
              </div>
              <Input
                type="search"
                variant="search"
                name="q"
                aria-label={d.shell.searchLabel}
                placeholder={d.shell.searchPlaceholder}
                maxLength={LIMITS.search}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="text-sm font-bold tracking-widest text-[var(--color-primary)]">
              {workspace.gymName || d.shell.gymAdmin}
            </span>
            {workspace.isProvisionalOwner ? (
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                {d.shell.provisionalOwner}
              </span>
            ) : null}
          </div>
          <div className="flex flex-1 items-center justify-end gap-4">
            <button
              type="button"
              className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
              aria-label={d.shell.notifications}
            >
              <Bell className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
              aria-label={d.shell.help}
            >
              <HelpCircle className="h-5 w-5" aria-hidden />
            </button>
            <ThemeToggle label={d.a11y.toggleTheme} />
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30">
              {initial}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
