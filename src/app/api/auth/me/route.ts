import { isAuthenticated, isPasswordSet } from "@/lib/auth";

export async function GET() {
  return Response.json({
    configured: isPasswordSet(),
    authenticated: await isAuthenticated(),
  });
}
