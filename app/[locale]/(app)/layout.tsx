import { getOnboardingState, getWorkspace } from "@/lib/auth/session";
import { getMemberContext } from "@/lib/auth/member-session";
import { needsOwnerOnboarding } from "@/lib/auth/post-auth-redirect";
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
import { AppNav } from "@/components/app-nav";
import { OpsMobileNav } from "@/components/ops-mobile-nav";
import { OpsNavLogo } from "@/components/ops-nav-logo";
import { AmrapWatermark } from "@/components/amrap-watermark";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Settings } from "lucide-react";
import { canInWorkspace } from "@/lib/auth/permissions";
import { brandThemeCssVars } from "@/lib/branding/theme";
import { canUseWhitelabel } from "@/lib/plans/limits";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const workspace = await getWorkspace();
  if (!workspace) {
    return { title: "AMRAP" };
  }

  const gymName = workspace.gymName.trim() || "AMRAP";
  const allowBrand = canUseWhitelabel(workspace.planTier);
  const light = allowBrand ? workspace.logoUrlLight : null;
  const dark = allowBrand ? workspace.logoUrlDark : null;
  const iconLight = light || dark;
  const iconDark = dark || light;

  const icons: Metadata["icons"] = iconLight
    ? {
        icon: [
          {
            url: iconLight,
            type: "image/png",
            ...(iconDark && iconDark !== iconLight
              ? { media: "(prefers-color-scheme: light)" as const }
              : {}),
          },
          ...(iconDark && iconDark !== iconLight
            ? [
                {
                  url: iconDark,
                  type: "image/png",
                  media: "(prefers-color-scheme: dark)" as const,
                },
              ]
            : []),
        ],
        apple: [{ url: iconLight }],
      }
    : undefined;

  return {
    title: {
      default: gymName,
      template: `%s | ${gymName}`,
    },
    description: gymName,
    icons,
  };
}

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
  const workspace = await getWorkspace();

  if (await getPendingInvite()) {
    redirect(invitePath(locale));
  }

  // Invited staff/trainers have a gym workspace but no org they created —
  // only org creators mid-setup are forced through owner onboarding.
  if (await needsOwnerOnboarding(onboarding)) {
    redirect(`/${locale}/onboarding`);
  }

  if (await needsProfileWelcome()) {
    redirect(welcomePath(locale));
  }

  if (!workspace) {
    const member = await getMemberContext();
    if (member) redirect(`/${locale}/me`);
    redirect(`/${locale}/onboarding`);
  }

  const d = getDictionary(locale);
  const initial =
    workspace.fullName?.charAt(0).toUpperCase() ||
    workspace.userId.slice(0, 2).toUpperCase();
  const canManageSettings = canInWorkspace(workspace, "manage_billing");
  const canManageStaff = canInWorkspace(workspace, "manage_staff");

  const allowBrand = canUseWhitelabel(workspace.planTier);
  const { light, dark } = brandThemeCssVars(
    allowBrand ? workspace.themeLight : {},
    allowBrand ? workspace.themeDark : {},
  );
  const lightDecls = Object.entries(light)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  const darkDecls = Object.entries(dark)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");

  const logoUrlLight = allowBrand ? workspace.logoUrlLight : null;
  const logoUrlDark = allowBrand ? workspace.logoUrlDark : null;

  const supabase = await createClient();
  const { data: personRow } = await supabase
    .from("persons")
    .select("qr_code")
    .eq("id", workspace.personId)
    .maybeSingle();
  const qrCode = personRow?.qr_code ?? null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `.amrap-branded{${lightDecls}}.dark .amrap-branded{${darkDecls}}`,
        }}
      />
      <div className="amrap-branded flex h-screen flex-col overflow-hidden bg-[var(--color-bg)]">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AppNav
            locale={locale}
            role={workspace.role}
            canManageSettings={canManageSettings}
            canManageStaff={canManageStaff}
            hiddenNavIds={workspace.hiddenNavIds}
            logoUrlLight={logoUrlLight}
            logoUrlDark={logoUrlDark}
            gymName={workspace.gymName}
            organizationName={workspace.organizationName}
            isProvisionalOwner={workspace.isProvisionalOwner}
          />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:h-[4.25rem] sm:gap-3 sm:px-6">
              <Link
                href={`/${locale}/dashboard`}
                className="min-w-0 flex-1 md:hidden"
                aria-label={workspace.gymName || d.nav.dashboard}
              >
                <OpsNavLogo
                  logoUrlLight={logoUrlLight}
                  logoUrlDark={logoUrlDark}
                  gymName={workspace.gymName}
                  size="sm"
                />
              </Link>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <ThemeToggle
                  label={d.a11y.toggleTheme}
                  className="h-11 w-11"
                />
                <Link
                  href={`/${locale}/settings`}
                  className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] md:inline-flex"
                  aria-label={d.nav.settings}
                  title={d.nav.settings}
                >
                  <Settings className="h-5 w-5" aria-hidden />
                </Link>
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-sm font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30">
                  {initial}
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
        <AmrapWatermark locale={locale} label={d.shell.poweredBy} />
        <OpsMobileNav
          locale={locale}
          role={workspace.role}
          canManageSettings={canManageSettings}
          canManageStaff={canManageStaff}
          hiddenNavIds={workspace.hiddenNavIds}
          gymName={workspace.gymName}
          organizationName={workspace.organizationName}
          isProvisionalOwner={workspace.isProvisionalOwner}
          qrCode={qrCode}
          fullName={workspace.fullName}
        />
      </div>
    </>
  );
}
