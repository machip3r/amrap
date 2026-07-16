"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  /** Pixel size used when generating the QR (higher = sharper when scaled). */
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
      margin: 1,
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
        className={`aspect-square animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] ${className}`.trim()}
        style={className.includes("w-") ? undefined : { width: size, height: size }}
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
      className={`rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm ${className}`.trim()}
    />
  );
}
