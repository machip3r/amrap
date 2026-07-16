"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";

export function MemberQrClient({
  locale,
  qrCode,
  name,
}: {
  locale: Locale;
  qrCode: string;
  name: string | null;
}) {
  const d = getDictionary(locale);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <h1 className="font-title text-3xl font-bold text-[var(--color-text)]">
        {d.member.qr}
      </h1>
      <p className="max-w-sm text-sm text-[var(--color-muted)]">{d.member.qrHint}</p>
      {name ? (
        <p className="text-lg font-semibold text-[var(--color-text)]">{name}</p>
      ) : null}
      <div className="w-full max-w-md rounded-3xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-6 py-10 shadow-sm">
        <p className="break-all font-mono text-2xl font-bold tracking-wide text-[var(--color-text)] sm:text-3xl">
          {qrCode}
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        className="shadow-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(qrCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* ignore */
          }
        }}
      >
        {copied ? (locale === "es" ? "Copiado" : "Copied") : locale === "es" ? "Copiar" : "Copy"}
      </Button>
    </div>
  );
}
