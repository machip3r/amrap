"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Check,
  QrCode,
  Search,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  confirmCheckIn,
  runCheckIn,
  searchCheckInCandidates,
  walkInEnroll,
  type CheckinCandidate,
  type CheckinMember,
  type CheckinResult,
} from "@/app/[locale]/(app)/checkin/actions";
import { RegisterUserButton, type RegisterPlanOption } from "@/components/register-user-dialog";
import { CheckInList } from "@/components/checkin-list";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import type { CheckInListItem } from "@/lib/checkin/queries";
import { LIMITS } from "@/lib/validation/schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export type CheckinLabels = {
  title: string;
  subtitle: string;
  scanTitle: string;
  scanHint: string;
  manualTitle: string;
  manualLabel: string;
  manualPlaceholder: string;
  lookup: string;
  clear: string;
  scanning: string;
  lookingUp: string;
  stopCamera: string;
  startCamera: string;
  resultOk: string;
  resultDenied: string;
  memberNotFound: string;
  selectMember: string;
  confirmCheckIn: string;
  matchesHint: string;
  active: string;
  expired: string;
  qrInUse: string;
  cameraError: string;
  forbidden: string;
  saveFailed: string;
  accessGranted: string;
  accessDenied: string;
  qrSuccessTitle: string;
  qrSuccessHint: string;
  waitingResult: string;
  waitingResultHint: string;
  expiresIn: string;
  days: string;
  weekAttendance: string;
  noPlan: string;
  nextScan: string;
  classReserved: string;
  walkInTitle: string;
  walkInEnroll: string;
  walkInFull: string;
  noOpenClasses: string;
  todayTitle: string;
  todayEmpty: string;
  viewAllCheckIns: string;
  colMember: string;
  colTime: string;
  colPlan: string;
  colSource: string;
  sourceQr: string;
  sourceManual: string;
  sourceKiosk: string;
};

type Props = {
  labels: CheckinLabels;
  runCheckIn: typeof runCheckIn;
  locale: Locale;
  canManageMembers: boolean;
  canManageStaff: boolean;
  plans?: RegisterPlanOption[];
  todayCheckIns: CheckInListItem[];
};

type ResultView =
  | { kind: "idle" }
  | { kind: "pick"; matches: CheckinCandidate[] }
  | { kind: "ok"; member: CheckinMember | null; message: string }
  | { kind: "error"; title: string; message: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function CheckinClient({
  labels,
  runCheckIn,
  locale,
  canManageMembers,
  canManageStaff,
  plans = [],
  todayCheckIns,
}: Props) {
  const router = useRouter();
  const [manual, setManual] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [result, setResult] = useState<ResultView>({ kind: "idle" });
  const [qrCelebration, setQrCelebration] = useState<{
    name: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = useId().replace(/:/g, "");

  const dismissQrCelebration = useCallback(() => {
    setQrCelebration(null);
  }, []);

  const applyResult = useCallback(
    (r: CheckinResult, opts?: { celebrate?: boolean }) => {
      if (r.status === "ok") {
        setResult({ kind: "ok", member: r.member, message: labels.resultOk });
        if (opts?.celebrate) {
          setQrCelebration({ name: r.member?.name ?? "" });
        }
        router.refresh();
        return;
      }
      const message =
        r.status === "denied"
          ? labels.resultDenied
          : r.status === "not_found"
            ? labels.memberNotFound
            : r.status === "busy"
              ? labels.qrInUse
              : r.status === "forbidden"
                ? labels.forbidden
                : r.status === "empty"
                  ? labels.manualPlaceholder
                  : labels.saveFailed;
      setResult({
        kind: "error",
        title: labels.accessDenied,
        message,
      });
    },
    [labels, router],
  );

  const handleQrCode = useCallback(
    (code: string) => {
      startTransition(() => {
        void runCheckIn(code).then((r) =>
          applyResult(r, { celebrate: true }),
        );
      });
    },
    [applyResult, runCheckIn],
  );

  useEffect(() => {
    if (!qrCelebration) return;
    const t = window.setTimeout(() => setQrCelebration(null), 2800);
    return () => window.clearTimeout(t);
  }, [qrCelebration]);

  function handleManualSearch() {
    const q = manual.trim();
    if (!q) return;
    startTransition(() => {
      void searchCheckInCandidates(q).then((r) => {
        if (r.status === "matches") {
          setResult({ kind: "pick", matches: r.matches });
          return;
        }
        const message =
          r.status === "not_found"
            ? labels.memberNotFound
            : r.status === "forbidden"
              ? labels.forbidden
              : r.status === "empty"
                ? labels.manualPlaceholder
                : labels.saveFailed;
        setResult({
          kind: "error",
          title: labels.accessDenied,
          message,
        });
      });
    });
  }

  function handleSelectCandidate(membershipId: string) {
    startTransition(() => {
      void confirmCheckIn(membershipId).then(applyResult);
    });
  }

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => {});
      try {
        scannerRef.current?.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    };
  }, []);

  async function startCamera() {
    setResult({ kind: "idle" });
    try {
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          handleQrCode(decoded);
          void scanner.stop().then(() => {
            try {
              scanner.clear();
            } catch {
              /* ignore */
            }
            scannerRef.current = null;
            setCameraOn(false);
          });
        },
        () => {},
      );
      setCameraOn(true);
    } catch {
      setResult({
        kind: "error",
        title: labels.accessDenied,
        message: labels.cameraError,
      });
      setCameraOn(false);
    }
  }

  async function stopCamera() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
    setCameraOn(false);
  }

  function clearManual() {
    setManual("");
    setResult({ kind: "idle" });
  }

  const expiresDays =
    result.kind === "ok" && result.member
      ? daysUntil(result.member.expiresAt)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      {qrCelebration ? (
        <button
          type="button"
          aria-label={labels.qrSuccessHint}
          onClick={dismissQrCelebration}
          className="amrap-checkin-success-overlay fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center gap-5 bg-black/75 px-6 text-center backdrop-blur-sm"
        >
          <span className="relative inline-flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
            <span
              className="amrap-checkin-success-ring absolute inset-0 rounded-full border-[6px] border-[var(--color-success)]"
              aria-hidden
            />
            <span
              className="amrap-checkin-success-mark relative inline-flex h-full w-full items-center justify-center rounded-full bg-[var(--color-success)] text-white shadow-lg"
              aria-hidden
            >
              <Check className="h-20 w-20 sm:h-24 sm:w-24" strokeWidth={3} />
            </span>
          </span>
          <div className="amrap-checkin-success-mark flex flex-col gap-2">
            <p className="font-title text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {labels.qrSuccessTitle}
            </p>
            {qrCelebration.name ? (
              <p className="text-lg font-semibold text-white/90 sm:text-xl">
                {qrCelebration.name}
              </p>
            ) : null}
            <p className="text-sm text-white/65">{labels.qrSuccessHint}</p>
          </div>
        </button>
      ) : null}

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {labels.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{labels.subtitle}</p>
        </div>
        <RegisterUserButton
          locale={locale}
          canManageMembers={canManageMembers}
          canManageStaff={canManageStaff}
          plans={plans}
        />
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
          <h2 className="font-title text-2xl font-bold text-[var(--color-text)]">
            {labels.scanTitle}
          </h2>
          <p className="mt-1 max-w-md text-sm text-[var(--color-muted)]">
            {labels.scanHint}
          </p>

          <div className="relative mx-auto mt-6 flex w-full max-w-md flex-1 flex-col items-center justify-center">
            <div
              className={`relative w-full overflow-hidden rounded-2xl border-2 ${
                cameraOn
                  ? "border-[var(--color-primary)] bg-black"
                  : "aspect-square border-[var(--color-border)] bg-[var(--color-bg)]"
              }`}
            >
              <div id={regionId} className="checkin-qr-reader w-full" />
              {!cameraOn ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--color-muted)]">
                  <QrCode className="h-16 w-16 opacity-35" aria-hidden />
                </div>
              ) : null}
              <div className="pointer-events-none absolute left-3 top-3 z-10 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-[var(--color-primary)]" />
              <div className="pointer-events-none absolute right-3 top-3 z-10 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-[var(--color-primary)]" />
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-[var(--color-primary)]" />
              <div className="pointer-events-none absolute bottom-3 right-3 z-10 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-[var(--color-primary)]" />
            </div>

            <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-2">
              {!cameraOn ? (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] transition-colors hover:bg-[var(--color-primary-hover)]"
                >
                  {labels.startCamera}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void stopCamera()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
                >
                  {labels.stopCamera}
                </button>
              )}
              {cameraOn && pending ? (
                <span className="text-sm text-[var(--color-muted)]">
                  {labels.scanning}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
              {labels.manualTitle}
            </h2>
            <form
              className="mt-3 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleManualSearch();
              }}
            >
              <label className="sr-only" htmlFor="checkin-manual">
                {labels.manualLabel}
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
                  aria-hidden
                />
                <Input
                  id="checkin-manual"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder={labels.manualPlaceholder}
                  maxLength={LIMITS.checkInCode}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  variant="auth"
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={clearManual}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                >
                  {labels.clear}
                </button>
                <button
                  type="submit"
                  disabled={pending || manual.trim().length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  {pending && !cameraOn ? labels.lookingUp : labels.lookup}
                </button>
              </div>
            </form>
          </section>

          <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            {result.kind === "pick" ? (
              <>
                <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 px-5 py-3">
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                    {labels.selectMember}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {labels.matchesHint.replace(
                      "{count}",
                      String(result.matches.length),
                    )}
                  </p>
                </div>
                <ul className="flex max-h-[28rem] flex-1 flex-col gap-1 overflow-y-auto p-3">
                  {result.matches.map((m) => (
                    <li key={m.membershipId}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleSelectCandidate(m.membershipId)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
                      >
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]">
                          {initials(m.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-semibold text-[var(--color-text)]">
                              {m.name}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                m.active
                                  ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                                  : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                              }`}
                            >
                              {m.active ? labels.active : labels.expired}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--color-muted)]">
                            {[m.email, m.phone].filter(Boolean).join(" · ") ||
                              "—"}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--color-muted)]">
                            {m.planName ?? labels.noPlan}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-[var(--color-primary)]">
                          {labels.confirmCheckIn}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : result.kind === "ok" ? (
              <>
                <div className="flex items-center gap-2 bg-[var(--color-primary)] px-5 py-3 text-[var(--color-primary-on)]">
                  <Check className="h-5 w-5" aria-hidden strokeWidth={2.5} />
                  <p className="text-sm font-bold uppercase tracking-wide">
                    {labels.accessGranted}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  {result.member ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-base font-bold text-[var(--color-primary)]">
                          {initials(result.member.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-title text-xl font-bold text-[var(--color-text)]">
                            {result.member.name}
                          </p>
                          <span className="mt-1 inline-flex rounded-full border border-[var(--color-primary)]/50 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
                            {result.member.planName || labels.noPlan}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-[var(--color-bg)] px-3 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                            {labels.expiresIn}
                          </p>
                          <p className="mt-1 text-sm font-bold text-[var(--color-text)]">
                            {expiresDays} {labels.days}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[var(--color-bg)] px-3 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                            {labels.weekAttendance}
                          </p>
                          <p className="mt-1 text-sm font-bold text-[var(--color-text)]">
                            {result.member.weekCheckIns}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--color-muted)]">
                        {result.message}
                      </p>
                      {result.member.classBooking ? (
                        <p className="rounded-xl bg-[var(--color-success)]/10 px-3 py-2 text-sm font-medium text-[var(--color-success)]">
                          {labels.classReserved
                            .replace(
                              "{class}",
                              result.member.classBooking.className,
                            )
                            .replace(
                              "{time}",
                              new Date(
                                result.member.classBooking.startsAt,
                              ).toLocaleTimeString(locale === "es" ? "es-MX" : "en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                            )}
                        </p>
                      ) : null}
                      {result.member.openSessions &&
                      result.member.openSessions.length > 0 ? (
                        <div className="rounded-xl border border-[var(--color-border)] p-3">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            {labels.walkInTitle}
                          </p>
                          <ul className="flex flex-col gap-2">
                            {result.member.openSessions.map((s) => {
                              const full =
                                s.capacity != null &&
                                s.confirmedCount >= s.capacity &&
                                !s.hasBooking;
                              return (
                                <li
                                  key={s.sessionId}
                                  className="flex items-center justify-between gap-2 text-sm"
                                >
                                  <span className="min-w-0 truncate text-[var(--color-text)]">
                                    {s.className}
                                    {s.hasBooking
                                      ? ` · ${s.bookingStatus}`
                                      : ""}
                                  </span>
                                  {!s.hasBooking ? (
                                    full ? (
                                      <span className="shrink-0 text-xs text-[var(--color-muted)]">
                                        {labels.walkInFull}
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={pending}
                                        className="shrink-0 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-semibold"
                                        onClick={() => {
                                          startTransition(async () => {
                                            const res = await walkInEnroll(
                                              s.sessionId,
                                              result.member!.personId,
                                            );
                                            if (res.ok) {
                                              setResult({
                                                kind: "ok",
                                                member: {
                                                  ...result.member!,
                                                  classBooking: {
                                                    className: s.className,
                                                    startsAt: s.startsAt,
                                                    status: "attended",
                                                  },
                                                  openSessions:
                                                    result.member!.openSessions?.map(
                                                      (o) =>
                                                        o.sessionId ===
                                                        s.sessionId
                                                          ? {
                                                              ...o,
                                                              hasBooking: true,
                                                              bookingStatus:
                                                                "attended",
                                                            }
                                                          : o,
                                                    ),
                                                },
                                                message: labels.resultOk,
                                              });
                                            }
                                          });
                                        }}
                                      >
                                        {labels.walkInEnroll}
                                      </button>
                                    )
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : result.member && !result.member.classBooking ? (
                        <p className="text-xs text-[var(--color-muted)]">
                          {labels.noOpenClasses}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {result.message}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setResult({ kind: "idle" })}
                    className="mt-auto w-full rounded-lg border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
                  >
                    {labels.nextScan}
                  </button>
                </div>
              </>
            ) : result.kind === "error" ? (
              <>
                <div className="flex items-center gap-2 bg-[var(--color-danger)] px-5 py-3 text-white">
                  <X className="h-5 w-5" aria-hidden strokeWidth={2.5} />
                  <p className="text-sm font-bold uppercase tracking-wide">
                    {result.title}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <p className="text-sm text-[var(--color-text)]">{result.message}</p>
                  <button
                    type="button"
                    onClick={() => setResult({ kind: "idle" })}
                    className="mt-auto w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                  >
                    {labels.nextScan}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                  <UserRoundCheck className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">
                    {labels.waitingResult}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {labels.waitingResultHint}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
            {labels.todayTitle}
          </h2>
          <Link
            href={`/${locale}/checkin/history`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
          >
            {labels.viewAllCheckIns}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <CheckInList
          locale={locale}
          items={todayCheckIns}
          detailBaseHref={`/${locale}/checkin/history`}
          labels={{
            colMember: labels.colMember,
            colTime: labels.colTime,
            colPlan: labels.colPlan,
            colSource: labels.colSource,
            noPlan: labels.noPlan,
            sourceQr: labels.sourceQr,
            sourceManual: labels.sourceManual,
            sourceKiosk: labels.sourceKiosk,
            empty: labels.todayEmpty,
          }}
        />
      </section>
    </div>
  );
}
