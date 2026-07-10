import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPlan, deletePlan } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function PlansPage({
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

      {sp.error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]">{d.plans.error}</p>
      ) : null}

      <section className="max-w-md space-y-3 rounded border border-[var(--color-muted)]/30 bg-[var(--color-surface)]/40 p-4">
        <h2 className="text-lg font-medium">{d.plans.newPlan}</h2>
        <form action={createPlan} className="flex flex-col gap-2 text-sm">
          <input type="hidden" name="locale" value={locale} />
          <FormField label={d.plans.planName}>
            <Input required name="name" />
          </FormField>
          <FormField label={d.plans.price}>
            <Input required name="price" type="number" min={0} step="0.01" />
          </FormField>
          <FormField label={d.plans.durationDays}>
            <Input
              required
              name="duration_days"
              type="number"
              min={1}
              step={1}
              defaultValue={30}
            />
          </FormField>
          <Button type="submit" variant="appPrimary">
            {d.plans.save}
          </Button>
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
                  <Button type="submit" variant="link">
                    {d.plans.delete}
                  </Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
