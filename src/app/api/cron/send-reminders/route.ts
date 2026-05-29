import { NextRequest } from "next/server";
import { query, isDbConfigured, placeholders, todayIsoPacific, nowIso } from "@/lib/db";
import { sendReminderDigest, type ReminderForEmail } from "@/lib/resend";

// Vercel Cron hits this once a day. Manual triggers via ?secret= or Bearer
// header for local testing. See vercel.json for the schedule.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  const urlSecret = request.nextUrl.searchParams.get("secret");
  const authorized = auth === `Bearer ${secret}` || urlSecret === secret;
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const today = todayIsoPacific();

  const rows = await query(
    `select id, text, due_date, person_id, note_id
     from reminders
     where due_date <= $1 and sent_at is null
     order by due_date asc`,
    [today]
  );

  if (rows.length === 0) {
    return Response.json({ ok: true, sent: 0 });
  }

  const reminders = rows.map((r) => ({
    id: String(r.id),
    text: String(r.text),
    due_date: String(r.due_date),
    person_id: r.person_id ? String(r.person_id) : null,
    note_id: r.note_id ? String(r.note_id) : null,
  }));

  // Enrich with person names
  const personIds = Array.from(
    new Set(reminders.map((r) => r.person_id).filter((id): id is string => !!id))
  );
  const nameById: Record<string, string> = {};
  if (personIds.length > 0) {
    const peopleRows = await query(
      `select id, name from people where id in (${placeholders(personIds.length)})`,
      personIds
    );
    for (const r of peopleRows) nameById[String(r.id)] = String(r.name);
  }

  const enriched: ReminderForEmail[] = reminders.map((r) => ({
    ...r,
    person_name: r.person_id ? nameById[r.person_id] || null : null,
  }));

  try {
    await sendReminderDigest(enriched);
  } catch (err) {
    console.error("email send failed:", err);
    return Response.json({ error: "Email send failed" }, { status: 500 });
  }

  // Mark sent
  const ids = reminders.map((r) => r.id);
  const now = nowIso();
  await query(
    `update reminders set sent_at = $1 where id in (${placeholders(ids.length, 2)})`,
    [now, ...ids]
  );

  return Response.json({ ok: true, sent: ids.length });
}
