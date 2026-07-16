import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSessionUser } from "@/lib/auth/session";
import {
  getPendingInvite,
  invitePath,
} from "@/lib/auth/invite-decision";
import { AmrapLogo } from "@/components/landing/amrap-logo";
import { LogoutButton } from "@/components/logout-button";
import { InvitePasswordForm } from "./password-form";

export default async function InvitePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  if (await getPendingInvite()) {
    redirect(invitePath(locale));
  }

  return (
    <div className="auth-container flex min-h-screen flex-col items-center justify-center p-6">
      <div className="glass-panel animate-fade-in-up flex w-full max-w-md flex-col rounded-2xl p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex w-full justify-center">
            <Link href={`/${locale}`} aria-label="AMRAP">
              <AmrapLogo priority className="h-12 w-auto sm:h-14" />
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {d.invite.passwordTitle}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {d.invite.passwordSubtitle}
          </p>
        </div>

        <InvitePasswordForm locale={locale} />

        <div className="mt-8 border-t border-[var(--color-border)] pt-5 text-center">
          <LogoutButton
            locale={locale}
            className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            {d.nav.logout}
          </LogoutButton>
        </div>
      </div>
    </div>
  );
}
