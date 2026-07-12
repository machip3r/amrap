"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { runCheckIn, type CheckinResult } from "@/app/[locale]/(app)/checkin/actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/validation/schemas";

type CheckinLabels = {
  manualLabel: string;
  manualPlaceholder: string;
  lookup: string;
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
      else if (r.status === "busy") setMessage(labels.qrInUse);
      else if (r.status === "forbidden") setMessage(labels.forbidden);
      else if (r.status === "error") setMessage(labels.saveFailed);
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
          <Button type="button" variant="appPrimary" className="mt-0" onClick={() => void startCamera()}>
            {labels.startCamera}
          </Button>
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
        <FormField label={labels.manualLabel}>
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={labels.manualPlaceholder}
            maxLength={LIMITS.checkInCode}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </FormField>
        <Button type="submit" variant="appPrimary" className="w-fit">
          {labels.lookup}
        </Button>
      </form>

      {message && <p className="text-lg">{message}</p>}
    </div>
  );
}
