import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Home, CalendarDays, Inbox, QrCode, LogOut, Timer } from "lucide-react";
import { getMemberContext } from "@/lib/auth/member-session";
import {
  getPendingInvite,
  invitePath,
} from "@/lib/auth/invite-decision";
import {
  needsProfileWelcome,
  welcomePath,
} from "@/lib/auth/profile-onboarding";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AmrapLogo } from "@/components/landing/amrap-logo";
import { AmrapWatermark } from "@/components/amrap-watermark";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export default async function MemberShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const member = await getMemberContext();
  if (!member) {
    redirect(`/${locale}/login`);
  }

  if (await getPendingInvite()) {
    redirect(invitePath(locale));
  }

  if (await needsProfileWelcome()) {
    redirect(welcomePath(locale));
  }

  const d = getDictionary(locale);
  const prefix = `/${locale}/me`;
  const initial =
    member.fullName?.charAt(0).toUpperCase() ??
    member.userId.slice(0, 2).toUpperCase();

  const links = [
    { href: prefix, label: d.member.home, icon: Home },
    { href: `${prefix}/classes`, label: d.member.classes, icon: CalendarDays },
    { href: `${prefix}/timers`, label: d.member.timers, icon: Timer },
    { href: `${prefix}/inbox`, label: d.member.inbox, icon: Inbox },
    { href: `${prefix}/qr`, label: d.member.qr, icon: QrCode },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-bg)]">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
        <Link
          href={prefix}
          className="flex items-center gap-2"
          aria-label="AMRAP"
        >
          <AmrapLogo className="h-7 w-auto" />
          <span className="hidden text-sm font-semibold text-[var(--color-text)] sm:inline">
            {d.member.title}
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] sm:px-3"
              title={link.label}
            >
              <link.icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle label={d.a11y.toggleTheme} />
          <LogoutButton
            locale={locale}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
            title={d.member.logout}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{d.member.logout}</span>
          </LogoutButton>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30">
            {initial}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
      <AmrapWatermark locale={locale} label={d.shell.poweredBy} />
    </div>
  );
}
