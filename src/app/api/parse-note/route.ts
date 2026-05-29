import Anthropic from "@anthropic-ai/sdk";
import { query, isDbConfigured, uuid, nowIso, todayIsoPacific } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

const anthropic = new Anthropic();

function buildSystemPrompt(todayPacific: string) {
  return `You are helping a roving listener track their conversations with neighbors. The listener is in the tradition of De'Amon Harges: listening for gifts, passions, and dreams (not needs).

When you parse a note, categorize gifts as:
- head: knowledge a person carries (history, languages, who lives where)
- heart: a passion or love (children, music, growing things)
- hand: a practical skill (carpentry, cooking, mechanics)
- teachable: something they are willing to teach others
- dream: an aspiration or wish

A single statement can produce multiple gifts. "Marcus used to teach woodworking and misses it" produces a hand gift (woodworking skill), a teachable (would teach woodworking), and a heart (loves teaching).

Match people against the provided list when you can; only mark a person as new if no plausible match exists. Be conservative about creating new people from passing mentions.

Do not infer needs or problems. Only extract what was actually heard.

FOLLOW-UPS

Today's date is ${todayPacific} (Pacific time, the listener's calendar).

Extract a follow-up only when the note contains an explicit commitment or event:
- The listener said they would do something ("I'll text Lila", "I should introduce them", "remember to ask")
- A future event or deadline was mentioned ("her recital is Friday", "he's back from his trip on the 10th")

Do NOT invent follow-ups from passing comments, general curiosity, or unstated implications.

For each follow-up, fill three fields:
- text: the action or thing to remember, written in the listener's voice (e.g., "Introduce Marcus to Lila", "Ask Lila about her recital")
- due_date: ISO date YYYY-MM-DD if a clear timing is given (resolve relative phrases against today). Use null if no date is mentioned.
- person_name: the single neighbor most relevant to the follow-up, or null if it doesn't center on one person. Use the name as it appears in the note.

Date resolution examples (today = ${todayPacific}):
- "tomorrow" → today + 1 day
- "next week" → today + 7 days
- "this Friday" → the upcoming Friday from today
- "in two weeks" → today + 14 days
- "on the 24th" → the next occurrence of the 24th
- "next month" → today + 30 days (approximate)

Only emit a due_date if the timing is reasonably specific. "Someday" or "eventually" should leave due_date null.`;
}

const TOOL_SCHEMA = {
  name: "record_note_extraction",
  description: "Extract people, gifts, and connections from a roving listener's note.",
  input_schema: {
    type: "object" as const,
    properties: {
      people: {
        type: "array",
        items: {
          type: "object",
          properties: {
            matched_id: {
              type: ["string", "null"],
              description: "ID from the provided people list if this is an existing person, null if new",
            },
            name: { type: "string" },
            where_they_are: { type: ["string", "null"] },
            gifts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  kind: {
                    type: "string",
                    enum: ["head", "heart", "hand", "teachable", "dream"],
                  },
                },
                required: ["text", "kind"],
              },
            },
            pointed_to: {
              type: "array",
              items: { type: "string" },
              description: "Names of other people this person mentioned",
            },
          },
          required: ["name", "gifts"],
        },
      },
      follow_ups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The action or thing to remember, in the listener's voice",
            },
            due_date: {
              type: ["string", "null"],
              description: "ISO date YYYY-MM-DD if a clear timing is given, otherwise null",
            },
            person_name: {
              type: ["string", "null"],
              description: "The neighbor most relevant to this follow-up, or null",
            },
          },
          required: ["text", "due_date", "person_name"],
        },
      },
    },
    required: ["people"],
  },
};

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { raw_text } = await request.json();
  if (!raw_text?.trim()) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  // Save the raw note first
  const noteId = uuid();
  const recordedAt = nowIso();
  await query(
    "insert into notes (id, raw_text, recorded_at) values ($1, $2, $3)",
    [noteId, raw_text, recordedAt]
  );

  // Existing people for matching
  const existing = await query("select id, name, aliases from people");
  const peopleContext = existing.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    aliases: (() => {
      try {
        return JSON.parse(String(r.aliases || "[]"));
      } catch {
        return [];
      }
    })(),
  }));

  const todayPacific = todayIsoPacific();

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: buildSystemPrompt(todayPacific),
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "record_note_extraction" },
      messages: [
        {
          role: "user",
          content: `Existing people in my notebook:\n${JSON.stringify(peopleContext)}\n\nNew note:\n${raw_text}`,
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    const structured = toolUse ? toolUse.input : { people: [], follow_ups: [] };

    await query("update notes set structured = $1 where id = $2", [
      JSON.stringify(structured),
      noteId,
    ]);

    return Response.json({ note_id: noteId, structured });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json(
      { note_id: noteId, structured: null, error: "Failed to parse note" },
      { status: 200 }
    );
  }
}
