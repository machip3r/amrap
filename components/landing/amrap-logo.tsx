"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type Props = {
  className?: string;
  priority?: boolean;
};

export function AmrapLogo({ className = "h-9 w-auto", priority }: Props) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <span className={`relative inline-block ${className}`} style={{ aspectRatio: "120/32" }}>
      {mounted ? (
        <Image
          src={isDark ? "/amrap-white-logo.png" : "/amrap-black-logo.png"}
          alt="AMRAP"
          width={120}
          height={32}
          priority={priority}
          className="h-full w-auto object-contain object-left"
        />
      ) : (
        <span className="block h-9 w-[7.5rem] rounded bg-[var(--landing-border)]/40" aria-hidden />
      )}
    </span>
  );
}
