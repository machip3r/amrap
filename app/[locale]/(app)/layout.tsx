import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getOnboardingState, getWorkspace } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AppNav } from "@/components/app-nav";
import { AmrapWatermark } from "@/components/amrap-watermark";
import { ThemeToggle } from "@/components/theme-toggle";
import { canInWorkspace } from "@/lib/auth/permissions";
import { brandThemeCssVars } from "@/lib/branding/theme";

export async function generateMetadata(): Promise<Metadata> {
  const workspace = await getWorkspace();
  if (!workspace) {
    return { title: "AMRAP" };
  }

  const gymName = workspace.gymName.trim() || "AMRAP";
  const light = workspace.logoUrlLight;
  const dark = workspace.logoUrlDark;
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

  const { light, dark } = brandThemeCssVars(
    workspace.themeLight,
    workspace.themeDark,
  );
  const lightDecls = Object.entries(light)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  const darkDecls = Object.entries(dark)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");

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
            canManageSettings={canInWorkspace(workspace, "manage_billing")}
            canManageStaff={canInWorkspace(workspace, "manage_staff")}
            logoUrlLight={workspace.logoUrlLight}
            logoUrlDark={workspace.logoUrlDark}
            gymName={workspace.gymName}
            organizationName={workspace.organizationName}
            isProvisionalOwner={workspace.isProvisionalOwner}
          />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center justify-end gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
              <ThemeToggle label={d.a11y.toggleTheme} />
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30">
                {initial}
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
          </div>
        </div>
        <AmrapWatermark locale={locale} label={d.shell.poweredBy} />
      </div>
    </>
  );
}
