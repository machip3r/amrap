import { type NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n/config";
import { negotiateLocale } from "@/lib/i18n/negotiate-locale";
import { updateSession } from "@/lib/supabase/update-session";

const publicPathRoots = new Set(["login", "register"]);


function applyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value, c);
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // App Router handlers under app/auth/* (confirm, ensure-org) — no locale prefix.
  if (pathname.startsWith("/auth/")) {
    const { supabaseResponse } = await updateSession(request);
    const res = NextResponse.next();
    applyCookies(supabaseResponse, res);
    return res;
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (!first || !isLocale(first)) {
    const url = request.nextUrl.clone();
    const suffix =
      pathname === "/" ? "" : pathname.startsWith("/") ? pathname : `/${pathname}`;
    const locale = negotiateLocale(request.headers.get("accept-language"));
    url.pathname = `/${locale}${suffix}`;
    const { supabaseResponse } = await updateSession(request);
    const redirect = NextResponse.redirect(url);
    applyCookies(supabaseResponse, redirect);
    return redirect;
  }

  const locale = first;
  const firstSegment = segments[1] ?? "";

  const { supabaseResponse, user } = await updateSession(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  applyCookies(supabaseResponse, res);
  res.headers.set("x-locale", locale);

  const isPublic = publicPathRoots.has(firstSegment);
  const isMarketingHome = segments.length === 1;

  if (!user && !isPublic && !isMarketingHome) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    const redirect = NextResponse.redirect(url);
    applyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (user && firstSegment === "login") {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    const redirect = NextResponse.redirect(url);
    applyCookies(supabaseResponse, redirect);
    return redirect;
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
