import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MemberQrImage } from "@/components/member-qr";
import { deleteMemberAction, renewMember } from "../actions";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  MEMBERSHIP_LIST_SELECT,
  mapMembershipRow,
} from "@/lib/members/queries";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "manage_members")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_LIST_SELECT)
    .eq("id", id)
    .eq("gym_id", workspace.gymId)
    .maybeSingle();

  const member = row
    ? mapMembershipRow(row as Parameters<typeof mapMembershipRow>[0])
    : null;
  if (!member) notFound();

  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, price, duration_days")
    .eq("gym_id", workspace.gymId)
    .eq("is_active", true)
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
            {d.members.membershipExpires}:{" "}
            {new Date(member.membership_expires_at).toLocaleString(locale)}
          </p>
          <p className="text-sm">
            {d.members.status}:{" "}
            {member.status === "active" ? d.members.active : d.members.expired}
          </p>
          <p className="break-all text-xs text-[var(--color-muted)]">
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
          <p className="text-sm text-[var(--color-muted)]">{d.plans.noPlans}</p>
        ) : (
          <form action={renewMember} className="flex flex-col gap-2 text-sm">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="member_id" value={member.id} />
            <FormField label={d.members.selectPlan}>
              <Select required name="plan_id" defaultValue={(plans ?? [])[0]?.id}>
                {(plans ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.duration_days}d / ${p.price}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={d.members.paymentMethod}>
              <Select name="method" defaultValue="cash">
                <option value="cash">{d.members.cash}</option>
                <option value="transfer">{d.members.transfer}</option>
              </Select>
            </FormField>
            <Button type="submit" variant="appPrimary">
              {d.members.renewSubmit}
            </Button>
          </form>
        )}
      </section>

      <form action={deleteMemberAction} className="max-w-md">
        <input type="hidden" name="member_id" value={member.id} />
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" variant="link">
          {d.members.delete}
        </Button>
      </form>
    </div>
  );
}
