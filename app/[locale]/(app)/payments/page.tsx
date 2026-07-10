import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPayment } from "./actions";
import { paymentMethodFromDb } from "@/lib/validation/db-enums";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);
  if (!can(profile.role, "record_payment")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("members")
    .select("id, name")
    .eq("tenant_id", profile.tenant_id)
    .order("name", { ascending: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, created_at, member_id")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })
    .limit(100);

  const memberName = new Map((members ?? []).map((m) => [m.id, m.name]));

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
        {(members ?? []).length === 0 ? (
          <p className="text-[var(--color-muted)]">{d.members.noMembers}</p>
        ) : (
          <form action={createPayment} className="flex flex-col gap-2 text-sm">
            <input type="hidden" name="locale" value={locale} />
            <FormField label={d.payments.member}>
              <Select
                required
                name="member_id"
                defaultValue={(members ?? [])[0]?.id}
              >
                {(members ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={d.payments.amount}>
              <Input required name="amount" type="number" min={0} step="0.01" />
            </FormField>
            <FormField label={d.payments.method}>
              <Select name="method" defaultValue="cash">
                <option value="cash">{d.members.cash}</option>
                <option value="transfer">{d.members.transfer}</option>
              </Select>
            </FormField>
            <Button type="submit" variant="appPrimary">
              {d.payments.submit}
            </Button>
          </form>
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
              <td className="py-2 pr-4">{memberName.get(p.member_id) ?? p.member_id}</td>
              <td className="py-2 pr-4">{p.amount}</td>
              <td className="py-2 pr-4">{methodLabel(p.method)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
