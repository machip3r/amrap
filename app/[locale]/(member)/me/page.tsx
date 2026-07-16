import { getMemberContext } from "@/lib/auth/member-session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { switchMemberGym } from "./actions";

export default async function MemberHomePage({
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

  const active = member.gyms.find((g) => g.gymId === member.activeGymId);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-title text-3xl font-bold text-[var(--color-text)]">
          {d.member.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {member.fullName ?? member.userId.slice(0, 8)}
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          {d.member.gyms}
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {member.gyms.map((g) => (
            <li
              key={g.gymId}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
                g.gymId === member.activeGymId
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)]"
              }`}
            >
              <div>
                <p className="font-semibold text-[var(--color-text)]">
                  {g.gymName}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {d.member.activeUntil}{" "}
                  {new Date(g.expiresAt).toLocaleDateString(
                    locale === "es" ? "es-MX" : "en-US",
                  )}
                </p>
              </div>
              {g.gymId !== member.activeGymId ? (
                <form action={switchMemberGym}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="gym_id" value={g.gymId} />
                  <button
                    type="submit"
                    className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-semibold"
                  >
                    {d.member.switchGym}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <nav className="grid gap-3 sm:grid-cols-3">
        {(
          [
            [`/${locale}/me/classes`, d.member.classes],
            [`/${locale}/me/inbox`, d.member.inbox],
            [`/${locale}/me/qr`, d.member.qr],
          ] as const
        ).map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-center font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
          >
            {label}
          </Link>
        ))}
      </nav>

      {active ? (
        <p className="text-sm text-[var(--color-muted)]">
          {active.gymName} · {d.member.activeUntil}{" "}
          {new Date(active.expiresAt).toLocaleDateString(
            locale === "es" ? "es-MX" : "en-US",
          )}
        </p>
      ) : null}
    </div>
  );
}
