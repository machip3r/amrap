"use client";

import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import { useRouter } from "next/navigation";

export function LogoutButton({
  label,
  locale,
}: {
  label: string;
  locale: Locale;
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
      className="text-[var(--color-primary)] hover:underline"
    >
      {label}
    </button>
  );
}
