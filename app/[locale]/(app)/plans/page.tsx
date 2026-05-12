import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPlan, deletePlan } from "./actions";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);
  if (!can(profile.role, "manage_plans")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">{d.plans.title}</h1>

      <section className="max-w-md space-y-3 rounded border border-[var(--color-muted)]/30 bg-[var(--color-surface)]/40 p-4">
        <h2 className="text-lg font-medium">{d.plans.newPlan}</h2>
        <form action={createPlan} className="flex flex-col gap-2 text-sm">
          <input type="hidden" name="locale" value={locale} />
          <label className="flex flex-col gap-1">
            <span className="text-[var(--color-muted)]">{d.plans.planName}</span>
            <input required name="name" className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--color-muted)]">{d.plans.price}</span>
            <input
              required
              name="price"
              type="number"
              min={0}
              step="0.01"
              className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--color-muted)]">{d.plans.durationDays}</span>
            <input
              required
              name="duration_days"
              type="number"
              min={1}
              step={1}
              defaultValue={30}
              className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1"
            />
          </label>
          <button type="submit" className="mt-2 bg-[var(--color-primary)] px-3 py-2 text-[var(--color-text)]">
            {d.plans.save}
          </button>
        </form>
      </section>

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-muted)]/40 text-[var(--color-muted)]">
            <th className="py-2 pr-4">{d.plans.planName}</th>
            <th className="py-2 pr-4">{d.plans.price}</th>
            <th className="py-2 pr-4">{d.plans.durationDays}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {(plans ?? []).length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-[var(--color-muted)]">
                {d.plans.noPlans}
              </td>
            </tr>
          )}
          {(plans ?? []).map((p) => (
            <tr key={p.id} className="border-b border-[var(--color-muted)]/20">
              <td className="py-2 pr-4">{p.name}</td>
              <td className="py-2 pr-4">{p.price}</td>
              <td className="py-2 pr-4">{p.duration_days}</td>
              <td className="py-2">
                <form action={deletePlan}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="plan_id" value={p.id} />
                  <button type="submit" className="text-[var(--color-primary)] hover:underline">
                    {d.plans.delete}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
