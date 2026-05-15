import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { demo } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim()?.toLowerCase();

  if (!q) {
    return Response.json({ people: [], gifts: [], notes: [] });
  }

  const supabase = createServerClient();

  if (!supabase) {
    const people = demo.people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.where_they_are && p.where_they_are.toLowerCase().includes(q)) ||
        p.aliases.some((a) => a.toLowerCase().includes(q))
    );

    const matchingGifts = demo.gifts.filter((g) => g.text.toLowerCase().includes(q));

    const existingIds = new Set(people.map((p) => p.id));
    const giftPeople = demo.people.filter(
      (p) => !existingIds.has(p.id) && matchingGifts.some((g) => g.person_id === p.id)
    );

    const notes = demo.notes
      .filter((n) => n.raw_text.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
      .map((n) => ({ id: n.id, raw_text: n.raw_text, recorded_at: n.recorded_at }));

    return Response.json({
      people: [...people, ...giftPeople],
      gifts: matchingGifts,
      notes,
    });
  }

  // Search people
  const { data: people } = await supabase
    .from("people")
    .select("*")
    .or(`name.ilike.%${q}%,where_they_are.ilike.%${q}%`)
    .limit(20);

  // Also search by full-text on gifts to find people with matching gifts
  const { data: matchingGifts } = await supabase
    .from("gifts")
    .select("person_id, text, kind")
    .ilike("text", `%${q}%`)
    .limit(30);

  // Get unique person IDs from gift matches that aren't already in people results
  const existingIds = new Set(people?.map((p) => p.id) || []);
  const giftPersonIds = new Set<string>();
  matchingGifts?.forEach((g) => {
    if (!existingIds.has(g.person_id)) {
      giftPersonIds.add(g.person_id);
    }
  });

  let giftPeople: typeof people = [];
  if (giftPersonIds.size > 0) {
    const { data } = await supabase
      .from("people")
      .select("*")
      .in("id", Array.from(giftPersonIds));
    giftPeople = data || [];
  }

  // Search notes
  const { data: notes } = await supabase
    .from("notes")
    .select("id, raw_text, recorded_at")
    .ilike("raw_text", `%${q}%`)
    .order("recorded_at", { ascending: false })
    .limit(20);

  return Response.json({
    people: [...(people || []), ...(giftPeople || [])],
    gifts: matchingGifts || [],
    notes: notes || [],
  });
}
