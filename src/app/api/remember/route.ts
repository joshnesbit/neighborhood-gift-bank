import Anthropic from "@anthropic-ai/sdk";
import { query, isDbConfigured, rowToPerson } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { GIFT_LABELS } from "@/lib/helpers";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { person_id } = await request.json();
  if (!person_id) {
    return Response.json({ error: "Missing person_id" }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  const personRows = await query("select * from people where id = $1 limit 1", [
    person_id,
  ]);
  if (!personRows[0]) {
    return Response.json({ error: "Person not found" }, { status: 404 });
  }
  const person = rowToPerson(personRows[0]);

  const giftRows = await query(
    "select kind, text from gifts where person_id = $1",
    [person_id]
  );

  const recentNoteRows = await query(
    `select n.raw_text, n.recorded_at
     from notes n join note_people np on np.note_id = n.id
     where np.person_id = $1
     order by n.recorded_at desc
     limit 3`,
    [person_id]
  );
  const recentNotes = recentNoteRows.map((r) => ({
    raw_text: String(r.raw_text),
    recorded_at: String(r.recorded_at),
  }));

  const giftsByKind: Record<string, string[]> = {};
  for (const r of giftRows) {
    const kind = String(r.kind);
    const text = String(r.text);
    if (!giftsByKind[kind]) giftsByKind[kind] = [];
    giftsByKind[kind].push(text);
  }

  const giftSummary = Object.entries(giftsByKind)
    .map(([kind, texts]) => `${GIFT_LABELS[kind] || kind}: ${texts.join(", ")}`)
    .join("\n");

  const notesSummary = recentNotes
    .map((n) => `[${new Date(n.recorded_at).toLocaleDateString()}] ${n.raw_text}`)
    .join("\n\n");

  const prompt = `Here is what I know about ${person.name}:

${person.where_they_are ? `Where: ${person.where_they_are}` : ""}
${giftSummary ? `\nGifts:\n${giftSummary}` : ""}
${notesSummary ? `\nRecent notes:\n${notesSummary}` : ""}

I am about to have a conversation with them. Give me 2-3 short things to keep in mind, oriented toward listening well (not toward what I should say). Be specific. Skip anything generic. Output as a plain list, no preamble.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    return Response.json({ reminders: text });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ error: "Failed to generate reminders" }, { status: 500 });
  }
}
