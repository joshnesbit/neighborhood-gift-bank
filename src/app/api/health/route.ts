import { NextRequest } from "next/server";
import { getSql, isDbConfigured } from "@/lib/db";
import { isAuthenticatedReq, unauthorized } from "@/lib/auth";

// Auth-gated DB health check. Tells you whether DATABASE_URL is set, whether
// the connection works, and whether each table exists — so "notes won't save"
// can be diagnosed without guesswork.
export async function GET(request: NextRequest) {
  if (!isAuthenticatedReq(request)) return unauthorized();

  if (!isDbConfigured()) {
    return Response.json({
      db: "not-configured",
      hint: "DATABASE_URL is not set in this environment.",
    });
  }

  const sql = getSql();

  try {
    await sql!.query("select 1 as ok", []);
  } catch (e) {
    return Response.json({
      db: "configured",
      connection: "failed",
      error: (e as Error).message,
      hint: "DATABASE_URL is set but the connection failed — check the connection string (use the pooled URL).",
    });
  }

  const tables = ["people", "notes", "gifts", "note_people", "connections", "reminders"];
  const counts: Record<string, number | string> = {};
  for (const t of tables) {
    try {
      const rows = await sql!.query(`select count(*)::int as n from ${t}`, []);
      counts[t] = Number(rows[0]?.n ?? 0);
    } catch (e) {
      counts[t] = `MISSING (${(e as Error).message})`;
    }
  }

  const anyMissing = Object.values(counts).some((v) => typeof v === "string");

  return Response.json({
    db: "configured",
    connection: "ok",
    schema: anyMissing ? "INCOMPLETE — run db/schema.sql in the Neon SQL editor" : "ok",
    tables: counts,
  });
}
