"use client";

import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import { useRouter } from "next/navigation";

export function LogoutButton({
  children,
  className,
  locale,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  locale: Locale;
  title?: string;
}) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className={className || "text-[var(--color-primary)] hover:underline"}
      title={title}
    >
      {children}
    </button>
  );
}
