import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Mail,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MemberQrImage } from "@/components/member-qr";
import { MemberDeleteSection } from "@/components/member-delete-section";
import { renewMember, savePersonCareNote } from "../actions";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  MEMBERSHIP_LIST_SELECT,
  mapMembershipRow,
} from "@/lib/members/queries";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

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
      <p className="text-[var(--color-muted)]">
        {getDictionary(locale).common.forbidden}
      </p>
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

  const active = member.status === "active";

  const { data: care } = await supabase
    .from("person_gym_care")
    .select("medical_note")
    .eq("gym_id", workspace.gymId)
    .eq("person_id", member.person_id)
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <Link
          href={`/${locale}/members`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {d.common.back}
        </Link>
      </div>

      <header className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-lg font-bold text-[var(--color-primary)]">
            {initials(member.name)}
          </span>
          <div className="min-w-0">
            <h1 className="font-title truncate text-3xl font-bold tracking-tight text-[var(--color-text)]">
              {member.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  active
                    ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                    : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                }`}
              >
                {active ? d.members.active : d.members.expired}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  member.invite_status === "pending"
                    ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                    : member.invite_status === "cancelled"
                      ? "bg-[var(--color-muted)]/20 text-[var(--color-muted)]"
                      : "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                }`}
              >
                {member.invite_status === "pending"
                  ? d.inviteStatus.pending
                  : member.invite_status === "cancelled"
                    ? d.inviteStatus.cancelled
                    : d.inviteStatus.accepted}
              </span>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                  member.plan_name
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-text)]"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-muted)]"
                }`}
              >
                {member.plan_name ?? d.members.noPlan}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
            {d.members.profile}
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <Mail
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
                aria-hidden
              />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  {d.members.email}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
                  {member.email ?? "—"}
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
                aria-hidden
              />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  {d.members.phone}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
                  {member.phone ?? "—"}
                </dd>
              </div>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <CalendarDays
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
                aria-hidden
              />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  {d.members.membershipExpires}
                </dt>
                <dd
                  className={`mt-0.5 text-sm font-medium tabular-nums ${
                    active
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-danger)]"
                  }`}
                >
                  {new Date(member.membership_expires_at).toLocaleString(
                    locale,
                  )}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        <section className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
          <h2 className="font-title self-start text-lg font-bold text-[var(--color-text)]">
            {d.members.qrCode}
          </h2>
          <div className="mt-4">
            <MemberQrImage value={member.qr_code} />
          </div>
          <p className="mt-3 max-w-full break-all text-center text-[11px] text-[var(--color-muted)]">
            {member.qr_code}
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
          {d.roster.careNote}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.roster.careNoteHint}
        </p>
        <form action={savePersonCareNote} className="mt-4 flex max-w-xl flex-col gap-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="person_id" value={member.person_id} />
          <input type="hidden" name="member_id" value={member.id} />
          <textarea
            name="medical_note"
            rows={3}
            maxLength={500}
            defaultValue={care?.medical_note ?? ""}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
          />
          <div>
            <Button type="submit" variant="primary" className="shadow-sm">
              {d.roster.careSave}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
            <CreditCard className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
              {d.members.renew}
            </h2>
            {(plans ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                {d.plans.noPlans}
              </p>
            ) : (
              <form
                action={renewMember}
                className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="member_id" value={member.id} />
                <FormField
                  label={d.members.selectPlan}
                  variant="auth"
                  className="sm:col-span-2"
                >
                  <Select
                    required
                    name="plan_id"
                    variant="auth"
                    defaultValue={(plans ?? [])[0]?.id}
                  >
                    {(plans ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.duration_days}d / ${p.price}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label={d.members.paymentMethod} variant="auth">
                  <Select name="method" defaultValue="cash" variant="auth">
                    <option value="cash">{d.members.cash}</option>
                    <option value="transfer">{d.members.transfer}</option>
                  </Select>
                </FormField>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full shadow-sm"
                  >
                    {d.members.renewSubmit}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <MemberDeleteSection
        locale={locale}
        memberId={member.id}
        memberName={member.name}
      />
    </div>
  );
}
