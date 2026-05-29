import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type {
  Person,
  Note,
  Gift,
  Connection,
  Reminder,
  NoteStructured,
} from "./database.types";

let _sql: NeonQueryFunction<false, false> | null = null;

/** The Neon SQL function, or null when DATABASE_URL is unset (demo mode). */
export function getSql(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!_sql) _sql = neon(url);
  return _sql;
}

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Run a parameterized query ($1, $2, …) and return rows as plain objects.
 * Throws if the database isn't configured — callers with a demo fallback
 * should gate on isDbConfigured() first.
 */
export async function query(
  text: string,
  params: unknown[] = []
): Promise<Record<string, unknown>[]> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL not configured");
  return (await sql.query(text, params)) as Record<string, unknown>[];
}

/** Build "$1, $2, …" placeholder lists for IN clauses. */
export function placeholders(count: number, start = 1): string {
  return Array.from({ length: count }, (_, i) => `$${start + i}`).join(", ");
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIsoPacific(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

// ---- Row mappers ---------------------------------------------------------

type Row = Record<string, unknown>;

function str(v: unknown): string {
  return String(v);
}
function strOrNull(v: unknown): string | null {
  return v === null || v === undefined ? null : String(v);
}
function num(v: unknown): number {
  return typeof v === "bigint" ? Number(v) : Number(v ?? 0);
}

export function rowToPerson(row: Row): Person {
  let aliases: string[] = [];
  try {
    aliases = JSON.parse(str(row.aliases ?? "[]"));
  } catch {
    aliases = [];
  }
  return {
    id: str(row.id),
    name: str(row.name),
    aliases,
    where_they_are: strOrNull(row.where_they_are),
    first_met_at: strOrNull(row.first_met_at),
    last_seen_at: strOrNull(row.last_seen_at),
    notes_count: num(row.notes_count),
    created_at: str(row.created_at),
    updated_at: str(row.updated_at),
  };
}

export function rowToNote(row: Row): Note {
  let structured: NoteStructured | null = null;
  if (row.structured) {
    try {
      structured = JSON.parse(str(row.structured)) as NoteStructured;
    } catch {
      structured = null;
    }
  }
  return {
    id: str(row.id),
    raw_text: str(row.raw_text),
    structured,
    recorded_at: str(row.recorded_at),
    created_at: str(row.created_at),
  };
}

export function rowToGift(row: Row): Gift {
  return {
    id: str(row.id),
    person_id: str(row.person_id),
    text: str(row.text),
    kind: str(row.kind) as Gift["kind"],
    source_note_id: strOrNull(row.source_note_id),
    created_at: str(row.created_at),
  };
}

export function rowToConnection(row: Row): Connection {
  return {
    id: str(row.id),
    from_person: str(row.from_person),
    to_person: str(row.to_person),
    reason: strOrNull(row.reason),
    source_note_id: strOrNull(row.source_note_id),
    status: str(row.status) as Connection["status"],
    created_at: str(row.created_at),
  };
}

export function rowToReminder(row: Row): Reminder {
  return {
    id: str(row.id),
    note_id: strOrNull(row.note_id),
    person_id: strOrNull(row.person_id),
    text: str(row.text),
    due_date: str(row.due_date),
    sent_at: strOrNull(row.sent_at),
    created_at: str(row.created_at),
  };
}
