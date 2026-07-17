import { headers } from "next/headers";

/**
 * Resolves the public app origin for auth redirects.
 * `Origin` is often missing on Server Actions — fall back to forwarded host / env.
 */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const fromOrigin = h.get("origin");
  if (fromOrigin) return fromOrigin.replace(/\/$/, "");

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env) return env;

  return "http://localhost:3000";
}
