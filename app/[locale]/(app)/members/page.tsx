import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { memberStatusFromExpires } from "@/lib/members/dates";
import { notFound } from "next/navigation";
import { createMember } from "./actions";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
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
  const { data: members } = await supabase
    .from("members")
    .select("id, name, phone, status, membership_expires_at")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  const rows = (members ?? []).map((m) => ({
    ...m,
    liveStatus: memberStatusFromExpires(m.membership_expires_at),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{d.members.title}</h1>
      </div>

      <section className="max-w-md space-y-3 rounded border border-[var(--color-muted)]/30 bg-[var(--color-surface)]/40 p-4">
        <h2 className="text-lg font-medium">{d.members.createTitle}</h2>
        <form action={createMember} className="flex flex-col gap-2 text-sm">
          <input type="hidden" name="locale" value={locale} />
          <label className="flex flex-col gap-1">
            <span className="text-[var(--color-muted)]">{d.members.name}</span>
            <input required name="name" className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--color-muted)]">{d.members.phone}</span>
            <input name="phone" className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--color-muted)]">{d.members.membershipExpires}</span>
            <input
              required
              type="datetime-local"
              name="membership_expires_at"
              defaultValue={toLocalInput(new Date())}
              className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1"
            />
          </label>
          <button type="submit" className="mt-2 bg-[var(--color-primary)] px-3 py-2 text-[var(--color-text)]">
            {d.members.save}
          </button>
        </form>
      </section>

      <section>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-muted)]/40 text-[var(--color-muted)]">
              <th className="py-2 pr-4">{d.members.name}</th>
              <th className="py-2 pr-4">{d.members.phone}</th>
              <th className="py-2 pr-4">{d.members.status}</th>
              <th className="py-2 pr-4">{d.members.expires}</th>
              <th className="py-2">{d.members.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-[var(--color-muted)]">
                  {d.members.noMembers}
                </td>
              </tr>
            )}
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-[var(--color-muted)]/20">
                <td className="py-2 pr-4">{m.name}</td>
                <td className="py-2 pr-4">{m.phone ?? "—"}</td>
                <td className="py-2 pr-4">
                  {m.liveStatus === "active" ? d.members.active : d.members.expired}
                </td>
                <td className="py-2 pr-4">{formatDate(m.membership_expires_at)}</td>
                <td className="py-2">
                  <Link className="text-[var(--color-primary)]" href={`/${locale}/members/${m.id}`}>
                    {d.members.view}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
