import { NextRequest } from "next/server";
import { query, isDbConfigured, uuid, nowIso } from "@/lib/db";
import { isAuthenticatedReq, unauthorized } from "@/lib/auth";
import type { NoteStructured } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  if (!isAuthenticatedReq(request)) return unauthorized();

  const { note_id, structured } = (await request.json()) as {
    note_id: string;
    structured: NoteStructured;
  };
  if (!note_id || !structured) {
    return Response.json({ error: "Missing note_id or structured data" }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  const now = nowIso();
  const today = now.split("T")[0];

  // Track which person each parsed name resolved to, so we can link reminders.
  const nameToId: Record<string, string> = {};

  for (const person of structured.people) {
    let personId = person.matched_id;

    if (!personId) {
      personId = uuid();
      await query(
        `insert into people (id, name, where_they_are, first_met_at, last_seen_at, notes_count, created_at, updated_at)
         values ($1, $2, $3, $4, $5, 1, $6, $7)`,
        [personId, person.name, person.where_they_are || null, today, now, now, now]
      );
    } else {
      const existing = await query(
        "select notes_count, where_they_are from people where id = $1",
        [personId]
      );
      const row = existing[0];
      const currentCount = row ? Number(row.notes_count || 0) : 0;
      const currentWhere = row && row.where_they_are ? String(row.where_they_are) : null;
      const newWhere =
        person.where_they_are && !currentWhere ? person.where_they_are : currentWhere;

      await query(
        `update people set last_seen_at = $1, notes_count = $2, where_they_are = $3, updated_at = $4 where id = $5`,
        [now, currentCount + 1, newWhere, now, personId]
      );
    }

    if (personId) nameToId[person.name.toLowerCase()] = personId;

    // Link person to note
    await query(
      "insert into note_people (note_id, person_id) values ($1, $2) on conflict do nothing",
      [note_id, personId]
    );

    // Gifts
    for (const g of person.gifts) {
      await query(
        `insert into gifts (id, person_id, text, kind, source_note_id) values ($1, $2, $3, $4, $5)`,
        [uuid(), personId, g.text, g.kind, note_id]
      );
    }

    // Connections from pointed_to
    if (person.pointed_to && person.pointed_to.length > 0) {
      for (const targetName of person.pointed_to) {
        const m = await query(
          "select id from people where name ilike $1 limit 1",
          [`%${targetName}%`]
        );
        let targetId = m[0] ? String(m[0].id) : null;

        if (!targetId) {
          targetId = uuid();
          await query(
            `insert into people (id, name, created_at, updated_at) values ($1, $2, $3, $4)`,
            [targetId, targetName, now, now]
          );
        }

        if (targetId && personId) {
          await query(
            `insert into connections (id, from_person, to_person, reason, source_note_id, status)
             values ($1, $2, $3, $4, $5, 'suggested')`,
            [uuid(), personId, targetId, `${person.name} pointed toward ${targetName}`, note_id]
          );
        }
      }
    }
  }

  // Reminders for any follow-ups with an explicit due_date
  if (structured.follow_ups && structured.follow_ups.length > 0) {
    for (const f of structured.follow_ups) {
      if (!f.due_date) continue;
      const personId = f.person_name ? nameToId[f.person_name.toLowerCase()] || null : null;
      await query(
        `insert into reminders (id, note_id, person_id, text, due_date) values ($1, $2, $3, $4, $5)`,
        [uuid(), note_id, personId, f.text, f.due_date]
      );
    }
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedReq(request)) return unauthorized();

  const noteId = request.nextUrl.searchParams.get("id");
  if (!noteId) return Response.json({ error: "Missing id" }, { status: 400 });

  if (!isDbConfigured()) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  await query("delete from notes where id = $1", [noteId]);
  return Response.json({ ok: true });
}
