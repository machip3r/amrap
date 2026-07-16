"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Debounced URL updates for list filters / search (resets `page` unless set).
 */
export function useListQueryParams(debounceMs = 300) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  function pushParams(
    current: URLSearchParams | Record<string, string | undefined>,
    patch: Record<string, string | null | undefined>,
    opts?: { debounce?: boolean; resetPage?: boolean },
  ) {
    const params =
      current instanceof URLSearchParams
        ? new URLSearchParams(current.toString())
        : new URLSearchParams(
            Object.entries(current)
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => [k, v as string]),
          );

    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "" || value === "all") params.delete(key);
      else params.set(key, value);
    }

    if (opts?.resetPage !== false && !("page" in patch)) {
      params.delete("page");
    }

    const qs = params.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;

    const go = () => {
      startTransition(() => {
        router.push(href);
      });
    };

    if (opts?.debounce) {
      if (timer.current != null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(go, debounceMs);
    } else {
      if (timer.current != null) window.clearTimeout(timer.current);
      go();
    }
  }

  function reload() {
    startTransition(() => {
      router.refresh();
    });
  }

  return { pending, pushParams, reload, pathname };
}
