import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Role } from "@/types";
import { can } from "@/lib/auth/permissions";

type NavProps = {
  locale: Locale;
  role: Role;
};

export function AppNav({ locale, role }: NavProps) {
  const d = getDictionary(locale);
  const prefix = `/${locale}`;

  const linkCls =
    "block rounded px-2 py-1.5 text-[var(--color-text)] hover:bg-[var(--color-bg)]/80";

  return (
    <aside className="w-52 shrink-0 border-r border-[var(--color-muted)]/30 bg-[var(--color-surface)] p-4">
      <div className="mb-6 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {d.meta.title}
      </div>
      <nav className="flex flex-col gap-1 text-sm">
        <Link className={linkCls} href={`${prefix}/dashboard`}>
          {d.nav.dashboard}
        </Link>
        {can(role, "manage_members") && (
          <Link className={linkCls} href={`${prefix}/members`}>
            {d.nav.members}
          </Link>
        )}
        {can(role, "manage_plans") && (
          <Link className={linkCls} href={`${prefix}/plans`}>
            {d.nav.plans}
          </Link>
        )}
        {can(role, "record_payment") && (
          <Link className={linkCls} href={`${prefix}/payments`}>
            {d.nav.payments}
          </Link>
        )}
        {can(role, "checkin") && (
          <Link className={linkCls} href={`${prefix}/checkin`}>
            {d.nav.checkin}
          </Link>
        )}
      </nav>
    </aside>
  );
}
