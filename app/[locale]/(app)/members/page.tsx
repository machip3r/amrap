import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CreateMemberForm } from "./create-member-form";
import {
  MEMBERSHIP_LIST_SELECT,
  mapMembershipRow,
} from "@/lib/members/queries";

export default async function MembersPage({
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
  if (!canInWorkspace(workspace, "manage_members")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_LIST_SELECT)
    .eq("gym_id", workspace.gymId)
    .order("created_at", { ascending: false });

  const members = (rows ?? [])
    .map((r) => mapMembershipRow(r as Parameters<typeof mapMembershipRow>[0]))
    .filter((m): m is NonNullable<typeof m> => m != null);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{d.members.title}</h1>
      </div>

      {sp.error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]">{d.members.error}</p>
      ) : null}

      <section className="max-w-md space-y-3 rounded border border-[var(--color-muted)]/30 bg-[var(--color-surface)]/40 p-4">
        <h2 className="text-lg font-medium">{d.members.createTitle}</h2>
        <CreateMemberForm locale={locale} defaultExpires={toLocalInput(new Date())} />
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
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-[var(--color-muted)]">
                  {d.members.noMembers}
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr key={m.id} className="border-b border-[var(--color-muted)]/20">
                <td className="py-2 pr-4">{m.name}</td>
                <td className="py-2 pr-4">{m.phone ?? "—"}</td>
                <td className="py-2 pr-4">
                  {m.status === "active" ? d.members.active : d.members.expired}
                </td>
                <td className="py-2 pr-4">{formatDate(m.membership_expires_at, locale)}</td>
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

function formatDate(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleString(locale);
  } catch {
    return iso;
  }
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
