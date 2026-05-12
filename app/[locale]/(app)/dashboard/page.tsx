import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);

  const d = getDictionary(locale);
  const supabase = await createClient();
  const tid = profile.tenant_id;
  const now = new Date().toISOString();

  const { count: total } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid);

  const { count: active } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .gte("membership_expires_at", now);

  const { count: expired } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .lt("membership_expires_at", now);

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count: paymentsToday } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .gte("created_at", start.toISOString());

  const cards = [
    { label: d.dashboard.totalMembers, value: total ?? 0 },
    { label: d.dashboard.activeMembers, value: active ?? 0 },
    { label: d.dashboard.expiredMembers, value: expired ?? 0 },
    { label: d.dashboard.paymentsToday, value: paymentsToday ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{d.dashboard.title}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded border border-[var(--color-muted)]/30 bg-[var(--color-surface)]/40 p-4"
          >
            <div className="text-sm text-[var(--color-muted)]">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
