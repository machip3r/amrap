import { redirect, notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import { canUseWhitelabel } from "@/lib/plans/limits";
import { PersonalizationForm } from "./personalization-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/onboarding`);
  if (!canInWorkspace(workspace, "manage_billing")) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header>
        <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {d.settings.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.settings.subtitle}
        </p>
      </header>

      <PersonalizationForm
        locale={locale}
        logoUrlLight={workspace.logoUrlLight}
        logoUrlDark={workspace.logoUrlDark}
        themeLight={workspace.themeLight}
        themeDark={workspace.themeDark}
        canCustomizeBrand={canUseWhitelabel(workspace.planTier)}
      />
    </div>
  );
}
