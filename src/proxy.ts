import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

// Next.js 16: "middleware" is now "proxy". Runs on the nodejs runtime.
// Gates every page behind the single-user passcode. API routes do their own
// server-side checks (and the cron uses CRON_SECRET), so /api is excluded.
export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;

  // No passcode configured → open (demo / local dev) mode.
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // The login page itself must always be reachable.
  if (pathname === "/login") return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session && session === password) return NextResponse.next();

  // Not signed in → send to login.
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Run on all page routes except API, Next internals, and public icons/manifest.
    "/((?!api|_next/static|_next/image|favicon.ico|favicon-32.png|icon.svg|icon-192.png|icon-512.png|apple-touch-icon.png|manifest.json).*)",
  ],
};
