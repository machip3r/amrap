import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { listCheckInsPage } from "@/lib/checkin/queries";
import { parsePage } from "@/lib/pagination";
import { isoDateSchema } from "@/lib/validation/schemas";
import { CheckInList } from "@/components/checkin-list";
import { CheckInHistoryFilters } from "@/components/checkin-history-filters";
import { TablePagination } from "@/components/ui/table-pagination";

function parseOptionalDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const parsed = isoDateSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function CheckinHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; date?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const sp = await searchParams;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "checkin")) {
    return (
      <p className="text-[var(--color-muted)]">
        {getDictionary(locale).common.forbidden}
      </p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const page = parsePage(sp.page);
  const today = todayIsoDate();
  const date = parseOptionalDate(sp.date) ?? today;
  const canManageMembers = canInWorkspace(workspace, "manage_members");

  const { items, meta } = await listCheckInsPage(supabase, workspace.gymId, {
    page,
    date,
  });

  const filterParams = {
    date,
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Link
          href={`/${locale}/checkin`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {d.checkin.backToCheckIn}
        </Link>
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {d.checkin.historyTitle}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {d.checkin.historySubtitle}
          </p>
        </div>
      </header>

      <CheckInHistoryFilters
        date={date}
        today={today}
        labels={{
          filterDate: d.checkin.filterDate,
          filterApply: d.checkin.filterApply,
          filterClear: d.checkin.filterClear,
        }}
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <CheckInList
          locale={locale}
          items={items}
          detailBaseHref={`/${locale}/checkin/history`}
          showMemberProfileLink={canManageMembers}
          labels={{
            colMember: d.checkin.colMember,
            colTime: d.checkin.colTime,
            colPlan: d.checkin.colPlan,
            colSource: d.checkin.colSource,
            noPlan: d.checkin.noPlan,
            sourceQr: d.checkin.sourceQr,
            sourceManual: d.checkin.sourceManual,
            sourceKiosk: d.checkin.sourceKiosk,
            empty: d.checkin.historyEmpty,
            viewMemberProfile: d.checkin.viewMemberProfile,
          }}
        />
        <TablePagination
          meta={meta}
          href={`/${locale}/checkin/history`}
          searchParams={filterParams}
          labels={{
            showing: d.members.showing,
            previous: d.common.previous,
            next: d.common.next,
          }}
        />
      </div>
    </div>
  );
}
