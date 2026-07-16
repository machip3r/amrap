"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  size?: number;
  alt?: string;
  className?: string;
};

/** Client-side QR image for dialogs / mobile chrome. */
export function QrCodeImage({
  value,
  size = 220,
  alt = "",
  className = "",
}: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className={`animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] ${className}`.trim()}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-sm ${className}`.trim()}
    />
  );
}
