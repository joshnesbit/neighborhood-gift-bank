import { NextRequest } from "next/server";
import { query, isDbConfigured, uuid, nowIso } from "@/lib/db";
import { isAuthenticatedReq, unauthorized } from "@/lib/auth";
import { demo } from "@/lib/demo-data";

export async function POST(request: NextRequest) {
  if (!isAuthenticatedReq(request)) return unauthorized();

  const { name, where_they_are, freeform } = await request.json();
  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  if (!isDbConfigured()) {
    // Demo mode: add to in-memory store
    const newPerson = {
      id: `demo-new-${Date.now()}`,
      name: name.trim(),
      aliases: [],
      where_they_are: where_they_are || null,
      first_met_at: new Date().toISOString().split("T")[0],
      last_seen_at: new Date().toISOString(),
      notes_count: freeform ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demo.people.push(newPerson);
    if (freeform) {
      const newNote = {
        id: `demo-note-${Date.now()}`,
        raw_text: freeform,
        structured: null,
        recorded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      demo.notes.push(newNote);
      demo.notePeople.push({ note_id: newNote.id, person_id: newPerson.id });
    }
    return Response.json({ id: newPerson.id });
  }

  const now = nowIso();
  const today = now.split("T")[0];
  const personId = uuid();

  await query(
    `insert into people (id, name, where_they_are, first_met_at, last_seen_at, notes_count, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      personId,
      name.trim(),
      where_they_are || null,
      today,
      now,
      freeform?.trim() ? 1 : 0,
      now,
      now,
    ]
  );

  if (freeform?.trim()) {
    const noteId = uuid();
    await query(
      `insert into notes (id, raw_text, recorded_at) values ($1, $2, $3)`,
      [noteId, freeform, now]
    );
    await query(
      `insert into note_people (note_id, person_id) values ($1, $2)`,
      [noteId, personId]
    );
  }

  return Response.json({ id: personId });
}
