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
import { createClient } from "@/lib/supabase/server";
import { AmrapLogo } from "@/components/landing/amrap-logo";
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

  const state = await getOnboardingState();
  if (!state) redirect(`/${locale}/login`);

  if (!state.organizationId) {
    redirect(`/${locale}/register`);
  }

  const workspace = await getWorkspace();
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
      </div>
    </div>
  );
}
