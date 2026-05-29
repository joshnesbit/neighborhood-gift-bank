import { NextRequest } from "next/server";
import { query, isDbConfigured, rowToPerson } from "@/lib/db";
import { isAuthenticatedReq, unauthorized } from "@/lib/auth";
import { demo } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedReq(request)) return unauthorized();

  const sort = request.nextUrl.searchParams.get("sort") || "recent";

  if (!isDbConfigured()) {
    const sorted = [...demo.people];
    switch (sort) {
      case "recent":
        sorted.sort(
          (a, b) =>
            new Date(b.last_seen_at || 0).getTime() -
            new Date(a.last_seen_at || 0).getTime()
        );
        break;
      case "past":
        sorted.sort(
          (a, b) =>
            new Date(a.last_seen_at || 0).getTime() -
            new Date(b.last_seen_at || 0).getTime()
        );
        break;
      case "alpha":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return Response.json(sorted);
  }

  let orderBy: string;
  switch (sort) {
    case "past":
      orderBy = "last_seen_at asc nulls first";
      break;
    case "alpha":
      orderBy = "lower(name) asc";
      break;
    case "recent":
    default:
      orderBy = "last_seen_at desc nulls last";
      break;
  }

  const rows = await query(`select * from people order by ${orderBy}`);
  return Response.json(rows.map(rowToPerson));
}
