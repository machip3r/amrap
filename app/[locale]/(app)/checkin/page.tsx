import { redirect, notFound } from "next/navigation";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CheckinClient } from "@/components/checkin-client";
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
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{d.checkin.title}</h1>
      <CheckinClient
        runCheckIn={runCheckIn}
        labels={{
          manualLabel: d.checkin.manualLabel,
          manualPlaceholder: d.checkin.manualPlaceholder,
          lookup: d.checkin.lookup,
          scanning: d.checkin.scanning,
          stopCamera: d.checkin.stopCamera,
          startCamera: d.checkin.startCamera,
          resultOk: d.checkin.resultOk,
          resultDenied: d.checkin.resultDenied,
          memberNotFound: d.checkin.memberNotFound,
          qrInUse: d.checkin.qrInUse,
          cameraError: d.checkin.cameraError,
          forbidden: d.common.forbidden,
          saveFailed: d.common.saveFailed,
        }}
      />
    </div>
  );
}
