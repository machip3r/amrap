import { redirect, notFound } from "next/navigation";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CheckinClient } from "@/components/checkin-client";
import { listTodayCheckIns } from "@/lib/checkin/queries";
import { runCheckIn } from "./actions";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

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
  const canManageMembers = canInWorkspace(workspace, "manage_members");
  const canManageStaff = canInWorkspace(workspace, "manage_staff");
  const supabase = await createClient();

  const [todayCheckIns, planRowsRes] = await Promise.all([
    listTodayCheckIns(supabase, workspace.gymId),
    canManageMembers
      ? supabase
          .from("plans")
          .select("id, name, price, duration_days")
          .eq("gym_id", workspace.gymId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const plans = (planRowsRes.data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    price: Number(p.price),
    duration_days: p.duration_days as number,
  }));

  return (
    <CheckinClient
      locale={locale}
      canManageMembers={canManageMembers}
      canManageStaff={canManageStaff}
      plans={plans}
      todayCheckIns={todayCheckIns}
      runCheckIn={runCheckIn}
      labels={{
        title: d.checkin.title,
        subtitle: d.checkin.subtitle,
        scanTitle: d.checkin.scanTitle,
        scanHint: d.checkin.scanHint,
        manualTitle: d.checkin.manualTitle,
        manualLabel: d.checkin.manualLabel,
        manualPlaceholder: d.checkin.manualPlaceholder,
        lookup: d.checkin.lookup,
        clear: d.checkin.clear,
        scanning: d.checkin.scanning,
        lookingUp: d.checkin.lookingUp,
        stopCamera: d.checkin.stopCamera,
        startCamera: d.checkin.startCamera,
        resultOk: d.checkin.resultOk,
        resultDenied: d.checkin.resultDenied,
        memberNotFound: d.checkin.memberNotFound,
        selectMember: d.checkin.selectMember,
        confirmCheckIn: d.checkin.confirmCheckIn,
        matchesHint: d.checkin.matchesHint,
        active: d.checkin.active,
        expired: d.checkin.expired,
        qrInUse: d.checkin.qrInUse,
        cameraError: d.checkin.cameraError,
        forbidden: d.common.forbidden,
        saveFailed: d.common.saveFailed,
        accessGranted: d.checkin.accessGranted,
        accessDenied: d.checkin.accessDenied,
        qrSuccessTitle: d.checkin.qrSuccessTitle,
        qrSuccessHint: d.checkin.qrSuccessHint,
        waitingResult: d.checkin.waitingResult,
        waitingResultHint: d.checkin.waitingResultHint,
        expiresIn: d.checkin.expiresIn,
        days: d.checkin.days,
        weekAttendance: d.checkin.weekAttendance,
        noPlan: d.checkin.noPlan,
        nextScan: d.checkin.nextScan,
        classReserved: d.checkin.classReserved,
        walkInTitle: d.checkin.walkInTitle,
        walkInEnroll: d.checkin.walkInEnroll,
        walkInFull: d.checkin.walkInFull,
        noOpenClasses: d.checkin.noOpenClasses,
        todayTitle: d.checkin.todayTitle,
        todayEmpty: d.checkin.todayEmpty,
        viewAllCheckIns: d.checkin.viewAllCheckIns,
        colMember: d.checkin.colMember,
        colTime: d.checkin.colTime,
        colPlan: d.checkin.colPlan,
        colSource: d.checkin.colSource,
        sourceQr: d.checkin.sourceQr,
        sourceManual: d.checkin.sourceManual,
        sourceKiosk: d.checkin.sourceKiosk,
      }}
    />
  );
}
