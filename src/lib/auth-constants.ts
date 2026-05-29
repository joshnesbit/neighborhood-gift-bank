// Shared between auth.ts (route handlers) and proxy.ts (request gate).
// Kept separate so proxy.ts doesn't pull in next/headers.
export const SESSION_COOKIE = "app_session";
