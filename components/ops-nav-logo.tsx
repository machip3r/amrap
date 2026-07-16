import { AmrapLogo } from "@/components/landing/amrap-logo";

type Props = {
  logoUrlLight?: string | null;
  logoUrlDark?: string | null;
  gymName?: string;
  /** Compact for collapsed sidebar / mobile header */
  size?: "sm" | "md";
  className?: string;
};

export function OpsNavLogo({
  logoUrlLight = null,
  logoUrlDark = null,
  gymName,
  size = "md",
  className = "",
}: Props) {
  const lightLogo = logoUrlLight || logoUrlDark;
  const darkLogo = logoUrlDark || logoUrlLight;
  const hasCustomLogo = Boolean(lightLogo || darkLogo);
  const sizeClass =
    size === "sm" ? "h-6 max-w-[2.75rem]" : "h-9 max-w-full";

  if (hasCustomLogo) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lightLogo ?? darkLogo ?? ""}
          alt={gymName || "AMRAP"}
          className={`w-auto object-contain object-left dark:hidden ${sizeClass} ${className}`.trim()}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={darkLogo ?? lightLogo ?? ""}
          alt={gymName || "AMRAP"}
          className={`hidden w-auto object-contain object-left dark:block ${sizeClass} ${className}`.trim()}
        />
      </>
    );
  }

  return (
    <AmrapLogo className={`w-auto ${sizeClass} ${className}`.trim()} />
  );
}
