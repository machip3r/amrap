import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  getOnboardingState,
  getSessionUser,
  getWorkspace,
} from "@/lib/auth/session";
import { getMemberContext } from "@/lib/auth/member-session";
import {
  needsOwnerOnboarding,
  resolvePostAuthPath,
  isInvitedOpsUser,
} from "@/lib/auth/post-auth-redirect";
import {
  getPendingInvite,
  invitePath,
} from "@/lib/auth/invite-decision";
import { createClient } from "@/lib/supabase/server";
import { AmrapLogo } from "@/components/landing/amrap-logo";
import { LogoutButton } from "@/components/logout-button";
import { OnboardingStepper } from "./onboarding-stepper";

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const sp = await searchParams;
  const d = getDictionary(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  if (await getPendingInvite()) {
    redirect(invitePath(locale));
  }

  // Invited staff/trainers use /invite → password → /welcome, never this flow.
  if (await isInvitedOpsUser()) {
    redirect(await resolvePostAuthPath(locale));
  }

  const state = await getOnboardingState();
  if (!state) redirect(`/${locale}/login`);

  const workspace = await getWorkspace();

  // Finished owner setup (or no longer mid owner onboarding).
  if (workspace && !(await needsOwnerOnboarding(state))) {
    redirect(`/${locale}/dashboard`);
  }

  // Member-only account should never sit in owner onboarding.
  if (!state.organizationId) {
    const member = await getMemberContext();
    if (member) redirect(`/${locale}/me`);
  }

  // Authenticated but org missing (e.g. confirm before RPC finished).
  // Org create + cookie clear must run in a Route Handler, not RSC render.
  if (!state.organizationId) {
    if (sp.error === "org") {
      return (
        <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
          <div className="glass-panel flex w-full max-w-md flex-col items-center rounded-2xl p-8 text-center shadow-2xl sm:p-10">
            <AmrapLogo priority className="mb-6 h-12 w-auto" />
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {d.onboarding.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--color-primary)]" role="alert">
              {d.onboarding.errorSave}
            </p>
            <Link
              href={`/auth/ensure-organization?locale=${locale}`}
              className="mt-6 text-sm font-semibold text-[var(--color-primary)] underline"
            >
              {d.common.back}
            </Link>
            <LogoutButton
              locale={locale}
              className="mt-4 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              {d.nav.logout}
            </LogoutButton>
          </div>
        </div>
      );
    }
    redirect(`/auth/ensure-organization?locale=${locale}`);
  }

  if (state.completed && workspace) {
    redirect(`/${locale}/dashboard`);
  }

  let plans: { id: string; name: string; price: number; duration_days: number }[] =
    [];
  if (state.gymId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("plans")
      .select("id, name, price, duration_days")
      .eq("gym_id", state.gymId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(2);
    plans = (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      duration_days: p.duration_days,
    }));
  }

  return (
    <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
      <div className="glass-panel animate-fade-in-up flex w-full max-w-lg flex-col rounded-2xl p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex w-full justify-center">
            <Link href={`/${locale}`} aria-label="AMRAP">
              <AmrapLogo priority className="h-12 w-auto sm:h-14" />
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {d.onboarding.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {d.onboarding.subtitle}
          </p>
        </div>
        <OnboardingStepper
          locale={locale}
          state={state}
          plans={plans}
          showError={Boolean(sp.error)}
        />
        <div className="mt-8 border-t border-[var(--color-border)] pt-5 text-center">
          <LogoutButton
            locale={locale}
            className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            {d.nav.logout}
          </LogoutButton>
        </div>
      </div>
    </div>
  );
}
