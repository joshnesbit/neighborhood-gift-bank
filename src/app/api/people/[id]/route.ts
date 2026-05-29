import { NextRequest } from "next/server";
import {
  query,
  isDbConfigured,
  placeholders,
  rowToPerson,
  rowToGift,
  rowToConnection,
} from "@/lib/db";
import { isAuthenticatedReq, unauthorized } from "@/lib/auth";
import { demo } from "@/lib/demo-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticatedReq(request)) return unauthorized();

  const { id } = await params;

  if (!isDbConfigured()) {
    const person = demo.people.find((p) => p.id === id);
    if (!person) return Response.json({ error: "Person not found" }, { status: 404 });

    const gifts = demo.gifts.filter((g) => g.person_id === id);
    const connectionsFrom = demo.connections.filter((c) => c.from_person === id);
    const connectionsTo = demo.connections.filter((c) => c.to_person === id);
    const nameMap = new Map(demo.people.map((p) => [p.id, p.name]));
    const noteIds = demo.notePeople
      .filter((np) => np.person_id === id)
      .map((np) => np.note_id);
    const notes = demo.notes
      .filter((n) => noteIds.includes(n.id))
      .sort(
        (a, b) =>
          new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      )
      .map((n) => ({
        id: n.id,
        raw_text: n.raw_text,
        recorded_at: n.recorded_at,
        created_at: n.created_at,
      }));

    return Response.json({
      ...person,
      gifts,
      connections_from: connectionsFrom.map((c) => ({
        ...c,
        to_person_name: nameMap.get(c.to_person),
      })),
      connections_to: connectionsTo.map((c) => ({
        ...c,
        from_person_name: nameMap.get(c.from_person),
      })),
      notes,
    });
  }

  const personRows = await query("select * from people where id = $1 limit 1", [id]);
  if (!personRows[0]) {
    return Response.json({ error: "Person not found" }, { status: 404 });
  }
  const person = rowToPerson(personRows[0]);

  const giftRows = await query(
    "select * from gifts where person_id = $1 order by created_at desc",
    [id]
  );
  const gifts = giftRows.map(rowToGift);

  const connFromRows = await query(
    "select * from connections where from_person = $1",
    [id]
  );
  const connectionsFrom = connFromRows.map(rowToConnection);

  const connToRows = await query(
    "select * from connections where to_person = $1",
    [id]
  );
  const connectionsTo = connToRows.map(rowToConnection);

  // Resolve names for connections
  const otherIds = new Set<string>();
  for (const c of connectionsFrom) otherIds.add(c.to_person);
  for (const c of connectionsTo) otherIds.add(c.from_person);

  const nameMap = new Map<string, string>();
  if (otherIds.size > 0) {
    const ids = Array.from(otherIds);
    const nameRows = await query(
      `select id, name from people where id in (${placeholders(ids.length)})`,
      ids
    );
    for (const r of nameRows) nameMap.set(String(r.id), String(r.name));
  }

  // Notes for this person
  const noteIdRows = await query(
    "select note_id from note_people where person_id = $1",
    [id]
  );
  const noteIds = noteIdRows.map((r) => String(r.note_id));

  let notes: Array<{
    id: string;
    raw_text: string;
    recorded_at: string;
    created_at: string;
  }> = [];

  if (noteIds.length > 0) {
    const noteRows = await query(
      `select id, raw_text, recorded_at, created_at from notes
       where id in (${placeholders(noteIds.length)}) order by recorded_at desc`,
      noteIds
    );
    notes = noteRows.map((r) => ({
      id: String(r.id),
      raw_text: String(r.raw_text),
      recorded_at: String(r.recorded_at),
      created_at: String(r.created_at),
    }));
  }

  return Response.json({
    ...person,
    gifts,
    connections_from: connectionsFrom.map((c) => ({
      ...c,
      to_person_name: nameMap.get(c.to_person),
    })),
    connections_to: connectionsTo.map((c) => ({
      ...c,
      from_person_name: nameMap.get(c.from_person),
    })),
    notes,
  });
}
