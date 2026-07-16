"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Role } from "@/types";
import {
  getVisibleOpsNavItems,
  isOpsNavActive,
  opsNavHref,
  splitMobileOpsNav,
  type OpsNavContext,
  type OpsNavItemDef,
} from "@/lib/nav/ops-nav";
import { LogOut, MoreHorizontal, QrCode } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { LogoutButton } from "./logout-button";
import { QrCodeImage } from "./qr-code-image";

export type OpsMobileNavProps = {
  locale: Locale;
  role: Role;
  canManageSettings?: boolean;
  canManageStaff?: boolean;
  hiddenNavIds?: readonly string[];
  gymName?: string;
  organizationName?: string;
  isProvisionalOwner?: boolean;
  /** Current user's person QR — shown for self check-in */
  qrCode?: string | null;
  fullName?: string | null;
};

function tabClass(active: boolean) {
  if (active) {
    return "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[var(--color-primary)]";
  }
  return "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]";
}

function moreLinkClass(active: boolean) {
  if (active) {
    return "flex min-h-12 items-center gap-3 rounded-lg bg-[var(--color-primary-soft)] px-4 py-3.5 text-base font-semibold text-[var(--color-text)]";
  }
  return "flex min-h-12 items-center gap-3 rounded-lg px-4 py-3.5 text-base font-medium text-[var(--color-text)]/80 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]";
}

function TabLink({
  item,
  prefix,
  pathname,
  label,
}: {
  item: OpsNavItemDef;
  prefix: string;
  pathname: string;
  label: string;
}) {
  const href = opsNavHref(prefix, item.path);
  const active = isOpsNavActive(pathname, href);
  const Icon = item.icon;
  return (
    <Link
      href={href}
      className={tabClass(active)}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-6 w-6 shrink-0" aria-hidden />
      <span className="max-w-full truncate text-[11px] font-semibold leading-tight">
        {label}
      </span>
    </Link>
  );
}

export function OpsMobileNav({
  locale,
  role,
  canManageSettings = false,
  canManageStaff = false,
  hiddenNavIds = [],
  gymName,
  organizationName,
  isProvisionalOwner = false,
  qrCode = null,
  fullName = null,
}: OpsMobileNavProps) {
  const d = getDictionary(locale);
  const prefix = `/${locale}`;
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const ctx: OpsNavContext = {
    role,
    canManageSettings,
    canManageStaff,
    hiddenNavIds,
  };
  const { primary, more } = splitMobileOpsNav(getVisibleOpsNavItems(ctx));
  const leftTabs = primary.slice(0, Math.ceil(primary.length / 2));
  const rightTabs = primary.slice(leftTabs.length);

  const moreActive = more.some((item) =>
    isOpsNavActive(pathname, opsNavHref(prefix, item.path)),
  );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label={d.nav.brandTitle}
      >
        <div className="relative flex items-stretch justify-around px-1 pt-1">
          {leftTabs.map((item) => (
            <TabLink
              key={item.id}
              item={item}
              prefix={prefix}
              pathname={pathname}
              label={item.getLabel(d)}
            />
          ))}

          {qrCode ? (
            <div className="relative flex min-w-[4.5rem] flex-1 items-start justify-center">
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-on)] shadow-lg ring-4 ring-[var(--color-surface)] transition-transform active:scale-95"
                aria-label={d.a11y.showMyQr}
                aria-haspopup="dialog"
                aria-expanded={qrOpen}
              >
                <QrCode className="h-7 w-7" aria-hidden />
              </button>
              <span className="mt-10 max-w-full truncate px-0.5 text-center text-[11px] font-semibold leading-tight text-[var(--color-muted)]">
                {d.nav.myQr}
              </span>
            </div>
          ) : null}

          {rightTabs.map((item) => (
            <TabLink
              key={item.id}
              item={item}
              prefix={prefix}
              pathname={pathname}
              label={item.getLabel(d)}
            />
          ))}

          <button
            type="button"
            className={tabClass(moreActive && !moreOpen)}
            onClick={() => setMoreOpen(true)}
            aria-label={d.a11y.openMoreNav}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <MoreHorizontal className="h-6 w-6 shrink-0" aria-hidden />
            <span className="max-w-full truncate text-[11px] font-semibold leading-tight">
              {d.nav.more}
            </span>
          </button>
        </div>
      </nav>

      <Dialog
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title={d.nav.more}
        closeLabel={d.a11y.closeMoreNav}
        containerClassName="items-end justify-center p-0 sm:items-center sm:p-6"
        className="max-w-none rounded-none rounded-t-2xl border-x-0 border-b-0 sm:max-w-md sm:rounded-2xl sm:border"
        bodyClassName="px-2 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        autoFocus={false}
      >
        <div className="space-y-0.5">
          {(organizationName || gymName) && (
            <div className="mb-2 border-b border-[var(--color-border)] px-4 pb-3 pt-1">
              <p className="truncate text-base font-semibold text-[var(--color-text)]">
                {organizationName || gymName}
              </p>
              {gymName && organizationName && gymName !== organizationName ? (
                <p className="truncate text-sm text-[var(--color-muted)]">
                  {gymName}
                </p>
              ) : (
                <p className="truncate text-sm text-[var(--color-muted)]">
                  {d.shell.gymAdmin}
                </p>
              )}
              {isProvisionalOwner ? (
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  {d.shell.provisionalOwner}
                </p>
              ) : null}
            </div>
          )}
          {more.map((item) => {
            const href = opsNavHref(prefix, item.path);
            const active = isOpsNavActive(pathname, href);
            const Icon = item.icon;
            const label =
              item.id === "organization"
                ? organizationName || gymName || d.shell.gymAdmin
                : item.getLabel(d);
            return (
              <Link
                key={item.id}
                href={href}
                className={moreLinkClass(active)}
                aria-current={active ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{label}</span>
              </Link>
            );
          })}
          <LogoutButton
            locale={locale}
            className={moreLinkClass(false)}
            title={d.nav.logout}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            <span>{d.nav.logout}</span>
          </LogoutButton>
        </div>
      </Dialog>

      {qrCode ? (
        <Dialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          title={d.nav.myQr}
          description={d.shell.myQrHint}
          closeLabel={d.a11y.closeMyQr}
          fullScreen
          bodyClassName="flex flex-col items-center justify-center gap-6 px-6 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center"
          autoFocus={false}
        >
          {fullName ? (
            <p className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
              {fullName}
            </p>
          ) : null}
          <QrCodeImage
            value={qrCode}
            size={512}
            alt={d.nav.myQr}
            className="h-auto w-[min(88vw,28rem)] max-w-full"
          />
          <p className="max-w-sm break-all font-mono text-base text-[var(--color-muted)] sm:text-lg">
            {qrCode}
          </p>
        </Dialog>
      ) : null}
    </>
  );
}
