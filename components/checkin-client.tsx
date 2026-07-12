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
  runCheckIn,
  type CheckinMember,
  type CheckinResult,
} from "@/app/[locale]/(app)/checkin/actions";
import { RegisterUserButton, type RegisterPlanOption } from "@/components/register-user-dialog";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { LIMITS } from "@/lib/validation/schemas";

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
  stopCamera: string;
  startCamera: string;
  resultOk: string;
  resultDenied: string;
  memberNotFound: string;
  qrInUse: string;
  cameraError: string;
  forbidden: string;
  saveFailed: string;
  accessGranted: string;
  accessDenied: string;
  waitingResult: string;
  waitingResultHint: string;
  expiresIn: string;
  days: string;
  weekAttendance: string;
  noPlan: string;
  nextScan: string;
};

type Props = {
  labels: CheckinLabels;
  runCheckIn: typeof runCheckIn;
  locale: Locale;
  canManageMembers: boolean;
  canManageStaff: boolean;
  plans?: RegisterPlanOption[];
};

type ResultView =
  | { kind: "idle" }
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
}: Props) {
  const [manual, setManual] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [result, setResult] = useState<ResultView>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = useId().replace(/:/g, "");

  const applyResult = useCallback(
    (r: CheckinResult) => {
      if (r.status === "ok") {
        setResult({ kind: "ok", member: r.member, message: labels.resultOk });
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
    [labels],
  );

  const handleCode = useCallback(
    (code: string) => {
      startTransition(() => {
        void runCheckIn(code).then(applyResult);
      });
    },
    [applyResult, runCheckIn],
  );

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
          handleCode(decoded);
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
              {pending ? (
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
                handleCode(manual);
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
                  {labels.lookup}
                </button>
              </div>
            </form>
          </section>

          <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            {result.kind === "ok" ? (
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
    </div>
  );
}
