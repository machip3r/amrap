import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { paymentMethodFromDb } from "@/lib/validation/db-enums";
import { CreatePaymentForm } from "./create-payment-form";
import {
  MEMBERSHIP_LIST_SELECT,
  mapMembershipRow,
} from "@/lib/members/queries";

export default async function PaymentsPage({
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

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "record_payment")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();

  const { data: membershipRows } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_LIST_SELECT)
    .eq("gym_id", workspace.gymId)
    .order("created_at", { ascending: false });

  const members = (membershipRows ?? [])
    .map((r) => mapMembershipRow(r as Parameters<typeof mapMembershipRow>[0]))
    .filter((m): m is NonNullable<typeof m> => m != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, created_at, membership_id")
    .eq("gym_id", workspace.gymId)
    .order("created_at", { ascending: false })
    .limit(100);

  const memberName = new Map(members.map((m) => [m.id, m.name]));

  function methodLabel(rawMethod: string) {
    const m = paymentMethodFromDb(rawMethod);
    if (m === "cash") return d.members.cash;
    if (m === "transfer") return d.members.transfer;
    return rawMethod;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">{d.payments.title}</h1>

      {sp.error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]">{d.payments.error}</p>
      ) : null}

      <section className="max-w-md space-y-3 rounded border border-[var(--color-muted)]/30 bg-[var(--color-surface)]/40 p-4">
        <h2 className="text-lg font-medium">{d.payments.newPayment}</h2>
        {members.length === 0 ? (
          <p className="text-[var(--color-muted)]">{d.members.noMembers}</p>
        ) : (
          <CreatePaymentForm
            locale={locale}
            members={members.map((m) => ({ id: m.id, name: m.name }))}
          />
        )}
      </section>

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-muted)]/40 text-[var(--color-muted)]">
            <th className="py-2 pr-4">{d.payments.date}</th>
            <th className="py-2 pr-4">{d.payments.member}</th>
            <th className="py-2 pr-4">{d.payments.amount}</th>
            <th className="py-2 pr-4">{d.payments.method}</th>
          </tr>
        </thead>
        <tbody>
          {(payments ?? []).length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-[var(--color-muted)]">
                {d.payments.noPayments}
              </td>
            </tr>
          )}
          {(payments ?? []).map((p) => (
            <tr key={p.id} className="border-b border-[var(--color-muted)]/20">
              <td className="py-2 pr-4">
                {new Date(p.created_at).toLocaleString(locale)}
              </td>
              <td className="py-2 pr-4">
                {memberName.get(p.membership_id) ?? p.membership_id}
              </td>
              <td className="py-2 pr-4">{p.amount}</td>
              <td className="py-2 pr-4">{methodLabel(p.method)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
