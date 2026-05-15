import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { demo } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const sort = request.nextUrl.searchParams.get("sort") || "recent";

  if (!supabase) {
    const sorted = [...demo.people];
    switch (sort) {
      case "recent":
        sorted.sort((a, b) => new Date(b.last_seen_at || 0).getTime() - new Date(a.last_seen_at || 0).getTime());
        break;
      case "unseen":
        sorted.sort((a, b) => new Date(a.last_seen_at || 0).getTime() - new Date(b.last_seen_at || 0).getTime());
        break;
      case "alpha":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return Response.json(sorted);
  }

  let query = supabase.from("people").select("*");

  switch (sort) {
    case "recent":
      query = query.order("last_seen_at", { ascending: false, nullsFirst: false });
      break;
    case "unseen":
      query = query.order("last_seen_at", { ascending: true, nullsFirst: true });
      break;
    case "alpha":
      query = query.order("name", { ascending: true });
      break;
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
