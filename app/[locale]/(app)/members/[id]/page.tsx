import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { memberStatusFromExpires } from "@/lib/members/dates";
import { MemberQrImage } from "@/components/member-qr";
import { deleteMemberAction, renewMember } from "../actions";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);
  if (!can(profile.role, "manage_members")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle();

  if (!member) notFound();

  const live = memberStatusFromExpires(member.membership_expires_at);

  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, price, duration_days")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <Link href={`/${locale}/members`} className="text-sm text-[var(--color-muted)] hover:underline">
        ← {d.common.back}
      </Link>
      <div className="flex flex-wrap gap-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{member.name}</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {d.members.phone}: {member.phone ?? "—"}
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            {d.members.membershipExpires}: {new Date(member.membership_expires_at).toLocaleString()}
          </p>
          <p className="text-sm">
            {d.members.status}: {live === "active" ? d.members.active : d.members.expired}
          </p>
          <p className="text-xs text-[var(--color-muted)] break-all">
            {d.members.qrCode}: {member.qr_code}
          </p>
        </div>
        <div>
          <p className="mb-2 text-sm text-[var(--color-muted)]">{d.members.qrCode}</p>
          <MemberQrImage value={member.qr_code} />
        </div>
      </div>

      <section className="max-w-md space-y-3 rounded border border-[var(--color-muted)]/30 bg-[var(--color-surface)]/40 p-4">
        <h2 className="text-lg font-medium">{d.members.renew}</h2>
        {(plans ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{getDictionary(locale).plans.noPlans}</p>
        ) : (
          <form action={renewMember} className="flex flex-col gap-2 text-sm">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="member_id" value={member.id} />
            <label className="flex flex-col gap-1">
              <span className="text-[var(--color-muted)]">{d.members.selectPlan}</span>
              <select
                required
                name="plan_id"
                defaultValue={(plans ?? [])[0]?.id}
                className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1"
              >
                {(plans ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.duration_days}d / ${p.price}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[var(--color-muted)]">{d.members.paymentMethod}</span>
              <select
                name="method"
                className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1"
                defaultValue="cash"
              >
                <option value="cash">{d.members.cash}</option>
                <option value="transfer">{d.members.transfer}</option>
              </select>
            </label>
            <button type="submit" className="mt-2 bg-[var(--color-primary)] px-3 py-2 text-[var(--color-text)]">
              {d.members.renewSubmit}
            </button>
          </form>
        )}
      </section>

      <form action={deleteMemberAction} className="max-w-md">
        <input type="hidden" name="member_id" value={member.id} />
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="text-sm text-[var(--color-primary)] underline">
          {d.members.delete}
        </button>
      </form>
    </div>
  );
}
