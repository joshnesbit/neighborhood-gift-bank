import { NextRequest } from "next/server";
import { query, isDbConfigured, placeholders, rowToPerson, rowToGift } from "@/lib/db";
import { isAuthenticatedReq, unauthorized } from "@/lib/auth";
import { demo } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedReq(request)) return unauthorized();

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return Response.json({ people: [], gifts: [], notes: [] });
  }

  if (!isDbConfigured()) {
    const qLower = q.toLowerCase();
    const people = demo.people.filter(
      (p) =>
        p.name.toLowerCase().includes(qLower) ||
        (p.where_they_are && p.where_they_are.toLowerCase().includes(qLower)) ||
        p.aliases.some((a) => a.toLowerCase().includes(qLower))
    );
    const matchingGifts = demo.gifts.filter((g) =>
      g.text.toLowerCase().includes(qLower)
    );
    const existingIds = new Set(people.map((p) => p.id));
    const giftPeople = demo.people.filter(
      (p) =>
        !existingIds.has(p.id) &&
        matchingGifts.some((g) => g.person_id === p.id)
    );
    const notes = demo.notes
      .filter((n) => n.raw_text.toLowerCase().includes(qLower))
      .sort(
        (a, b) =>
          new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      )
      .map((n) => ({
        id: n.id,
        raw_text: n.raw_text,
        recorded_at: n.recorded_at,
      }));
    return Response.json({
      people: [...people, ...giftPeople],
      gifts: matchingGifts,
      notes,
    });
  }

  const like = `%${q}%`;

  // People matched directly (name / aliases / where_they_are)
  const directRows = await query(
    `select * from people
     where name ilike $1 or where_they_are ilike $1 or aliases ilike $1
     order by lower(name) asc
     limit 20`,
    [like]
  );
  const directPeople = directRows.map(rowToPerson);
  const directIds = new Set(directPeople.map((p) => p.id));

  // Gifts matching the query
  const giftRows = await query(
    `select * from gifts where text ilike $1 limit 30`,
    [like]
  );
  const matchingGifts = giftRows.map(rowToGift);

  // People linked via gift matches but not already in directPeople
  const giftPersonIds = Array.from(
    new Set(
      matchingGifts.map((g) => g.person_id).filter((id) => !directIds.has(id))
    )
  );
  let giftPeople: ReturnType<typeof rowToPerson>[] = [];
  if (giftPersonIds.length > 0) {
    const rows = await query(
      `select * from people where id in (${placeholders(giftPersonIds.length)})`,
      giftPersonIds
    );
    giftPeople = rows.map(rowToPerson);
  }

  // Notes matching the query
  const noteRows = await query(
    `select id, raw_text, recorded_at from notes
     where raw_text ilike $1
     order by recorded_at desc
     limit 20`,
    [like]
  );
  const notes = noteRows.map((r) => ({
    id: String(r.id),
    raw_text: String(r.raw_text),
    recorded_at: String(r.recorded_at),
  }));

  return Response.json({
    people: [...directPeople, ...giftPeople],
    gifts: matchingGifts,
    notes,
  });
}
