import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale } from "@/shared/i18n/config";

/** ?lang=pl|uk|ru wins and is remembered in a cookie; otherwise the cookie, otherwise Polish. */
export function middleware(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("lang");
  const cookie = req.cookies.get(LANG_COOKIE)?.value;
  const locale = isLocale(q) ? q : isLocale(cookie) ? cookie : DEFAULT_LOCALE;

  const headers = new Headers(req.headers);
  headers.set("x-locale", locale);
  const res = NextResponse.next({ request: { headers } });
  if (isLocale(q) && q !== cookie) {
    res.cookies.set(LANG_COOKIE, q, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}

export const config = { matcher: ["/((?!api|_next|uploads|media|favicon.ico|robots.txt|sitemap.xml).*)"] };

