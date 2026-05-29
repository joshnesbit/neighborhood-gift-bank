-- Neighborhood Gift Bank — Neon (Postgres) schema
--
-- Apply once against your Neon database. Either:
--   • paste this into the Neon SQL Editor, or
--   • psql "$DATABASE_URL" -f db/schema.sql
--
-- Timestamps are stored as ISO-8601 text so they round-trip as plain strings
-- (matching new Date().toISOString()). This keeps the app code dialect-agnostic.

create table if not exists people (
  id text primary key,
  name text not null,
  aliases text not null default '[]',          -- JSON array of strings
  where_they_are text,
  first_met_at text,                            -- ISO date YYYY-MM-DD
  last_seen_at text,                            -- ISO timestamp
  notes_count integer not null default 0,
  created_at text not null default (to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at text not null default (to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);

create table if not exists notes (
  id text primary key,
  raw_text text not null,
  structured text,                              -- JSON
  recorded_at text not null default (to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  created_at text not null default (to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);

create table if not exists gifts (
  id text primary key,
  person_id text not null references people(id) on delete cascade,
  text text not null,
  kind text not null check (kind in ('head', 'heart', 'hand', 'teachable', 'dream')),
  source_note_id text references notes(id) on delete set null,
  created_at text not null default (to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);

create table if not exists note_people (
  note_id text not null references notes(id) on delete cascade,
  person_id text not null references people(id) on delete cascade,
  primary key (note_id, person_id)
);

create table if not exists connections (
  id text primary key,
  from_person text not null references people(id) on delete cascade,
  to_person text not null references people(id) on delete cascade,
  reason text,
  source_note_id text references notes(id) on delete set null,
  status text not null default 'suggested' check (status in ('suggested', 'introduced', 'done')),
  created_at text not null default (to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);

create table if not exists reminders (
  id text primary key,
  note_id text references notes(id) on delete cascade,
  person_id text references people(id) on delete set null,
  text text not null,
  due_date text not null,                       -- ISO date YYYY-MM-DD
  sent_at text,                                 -- ISO timestamp, null = pending
  created_at text not null default (to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);

-- Indexes
create index if not exists idx_gifts_person on gifts(person_id);
create index if not exists idx_gifts_kind on gifts(kind);
create index if not exists idx_note_people_person on note_people(person_id);
create index if not exists idx_note_people_note on note_people(note_id);
create index if not exists idx_connections_from on connections(from_person);
create index if not exists idx_connections_to on connections(to_person);
create index if not exists idx_people_last_seen on people(last_seen_at);
create index if not exists idx_people_name on people(name);
create index if not exists idx_reminders_pending on reminders(due_date) where sent_at is null;
create index if not exists idx_reminders_note on reminders(note_id);
create index if not exists idx_reminders_person on reminders(person_id);
