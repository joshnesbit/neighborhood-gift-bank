import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "./auth-constants";

export { SESSION_COOKIE };

/** Is APP_PASSWORD set in the environment? */
export function isPasswordSet(): boolean {
  return !!process.env.APP_PASSWORD;
}

/** Constant-time-ish password compare. */
export function passwordMatches(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ input.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Server-side check, for use inside route handlers via cookies().
 * Returns true if APP_PASSWORD is unset (demo / single-user no-auth mode).
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!isPasswordSet()) return true;
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  return !!session && session === process.env.APP_PASSWORD;
}

/** Request-scoped variant for places where the request object is in hand. */
export function isAuthenticatedReq(req: NextRequest): boolean {
  if (!isPasswordSet()) return true;
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  return !!session && session === process.env.APP_PASSWORD;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
