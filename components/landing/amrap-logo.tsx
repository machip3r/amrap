import Image from "next/image";

type Props = {
  className?: string;
  priority?: boolean;
};

/**
 * Black logo in light mode, white logo in dark mode.
 * Relies on `html.dark` from next-themes (+ @custom-variant dark in globals.css).
 */
export function AmrapLogo({ className = "h-9 w-auto", priority }: Props) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <Image
        src="/amrap-black-logo.png"
        alt="AMRAP"
        width={120}
        height={32}
        priority={priority}
        className="h-full w-auto max-w-none object-contain dark:hidden"
      />
      <Image
        src="/amrap-white-logo.png"
        alt=""
        width={120}
        height={32}
        priority={priority}
        aria-hidden
        className="hidden h-full w-auto max-w-none object-contain dark:block"
      />
    </span>
  );
}
