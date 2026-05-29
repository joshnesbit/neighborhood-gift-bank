import { NextRequest } from "next/server";
import { SESSION_COOKIE, isPasswordSet, passwordMatches } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isPasswordSet()) {
    return Response.json(
      { error: "APP_PASSWORD not configured on the server" },
      { status: 503 }
    );
  }

  const { password } = (await request.json()) as { password?: string };
  if (!password || !passwordMatches(password)) {
    // Speed bump: makes brute-forcing a short passcode impractical.
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    [
      `${SESSION_COOKIE}=${encodeURIComponent(password)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      // 60 days
      "Max-Age=5184000",
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ")
  );
  return res;
}
