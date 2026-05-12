"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { runCheckIn, type CheckinResult } from "@/app/[locale]/(app)/checkin/actions";

export type CheckinLabels = {
  manualLabel: string;
  manualPlaceholder: string;
  lookup: string;
  scanning: string;
  stopCamera: string;
  startCamera: string;
  resultOk: string;
  resultDenied: string;
  memberNotFound: string;
  cameraError: string;
  forbidden: string;
};

type Props = {
  labels: CheckinLabels;
  runCheckIn: typeof runCheckIn;
};

export function CheckinClient({ labels, runCheckIn }: Props) {
  const [manual, setManual] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [pending, startTransition] = useTransition();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "checkin-qr-region";

  const applyResult = useCallback(
    (r: CheckinResult) => {
      if (r.status === "ok") setMessage(labels.resultOk);
      else if (r.status === "denied") setMessage(labels.resultDenied);
      else if (r.status === "not_found") setMessage(labels.memberNotFound);
      else if (r.status === "forbidden") setMessage(labels.forbidden);
      else setMessage(null);
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
    setMessage(null);
    try {
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
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
      setMessage(labels.cameraError);
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

  return (
    <div className="max-w-lg space-y-6">
      <div id={regionId} className="min-h-[240px] w-full overflow-hidden rounded border border-[var(--color-muted)]/40 bg-black/40" />

      <div className="flex flex-wrap gap-2">
        {!cameraOn ? (
          <button
            type="button"
            onClick={() => void startCamera()}
            className="bg-[var(--color-primary)] px-3 py-2 text-sm text-[var(--color-text)]"
          >
            {labels.startCamera}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void stopCamera()}
            className="border border-[var(--color-muted)]/50 px-3 py-2 text-sm"
          >
            {labels.stopCamera}
          </button>
        )}
        {pending && <span className="self-center text-sm text-[var(--color-muted)]">{labels.scanning}</span>}
      </div>

      <form
        className="flex flex-col gap-2 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          handleCode(manual);
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-muted)]">{labels.manualLabel}</span>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={labels.manualPlaceholder}
            className="border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-2"
          />
        </label>
        <button type="submit" className="w-fit bg-[var(--color-primary)] px-3 py-2 text-[var(--color-text)]">
          {labels.lookup}
        </button>
      </form>

      {message && <p className="text-lg">{message}</p>}
    </div>
  );
}
