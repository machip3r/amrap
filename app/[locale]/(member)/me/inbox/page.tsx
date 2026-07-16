import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/auth/member-session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { markInboxRead } from "../actions";

export default async function MemberInboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);
  const member = await getMemberContext();
  if (!member) notFound();

  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("inbox_messages")
    .select("id, title, body, kind, read_at, created_at, gym_id")
    .eq("recipient_person_id", member.personId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark unread as read on view
  const unread = (messages ?? []).filter((m) => !m.read_at);
  if (unread.length > 0) {
    await supabase
      .from("inbox_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_person_id", member.personId)
      .is("read_at", null);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-title text-3xl font-bold text-[var(--color-text)]">
        {d.member.inbox}
      </h1>
      {(messages ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{d.member.emptyInbox}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(messages ?? []).map((m) => (
            <li
              key={m.id as string}
              className={`rounded-2xl border px-4 py-3 ${
                m.read_at
                  ? "border-[var(--color-border)] bg-[var(--color-surface)]"
                  : "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--color-text)]">
                    {m.title as string}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {m.body as string}
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {new Date(m.created_at as string).toLocaleString(
                      locale === "es" ? "es-MX" : "en-US",
                    )}
                  </p>
                </div>
                {!m.read_at ? (
                  <form action={markInboxRead}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="message_id" value={m.id as string} />
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
