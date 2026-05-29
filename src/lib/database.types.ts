export type GiftKind = "head" | "heart" | "hand" | "teachable" | "dream";
export type ConnectionStatus = "suggested" | "introduced" | "done";

export interface Person {
  id: string;
  name: string;
  aliases: string[];
  where_they_are: string | null;
  first_met_at: string | null;
  last_seen_at: string | null;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  raw_text: string;
  structured: NoteStructured | null;
  recorded_at: string;
  created_at: string;
}

export interface Gift {
  id: string;
  person_id: string;
  text: string;
  kind: GiftKind;
  source_note_id: string | null;
  created_at: string;
}

export interface Connection {
  id: string;
  from_person: string;
  to_person: string;
  reason: string | null;
  source_note_id: string | null;
  status: ConnectionStatus;
  created_at: string;
}

export interface NotePerson {
  note_id: string;
  person_id: string;
}

export interface FollowUp {
  text: string;
  due_date: string | null; // ISO date YYYY-MM-DD, in Pacific time
  person_name: string | null;
}

export interface NoteStructured {
  people: {
    matched_id: string | null;
    name: string;
    where_they_are?: string | null;
    gifts: { text: string; kind: GiftKind }[];
    pointed_to?: string[];
  }[];
  follow_ups?: FollowUp[];
}

export interface Reminder {
  id: string;
  note_id: string | null;
  person_id: string | null;
  text: string;
  due_date: string; // YYYY-MM-DD
  sent_at: string | null;
  created_at: string;
}

export interface PersonWithGifts extends Person {
  gifts: Gift[];
}

export interface PersonWithDetails extends Person {
  gifts: Gift[];
  connections_from: (Connection & { to_person_name?: string })[];
  connections_to: (Connection & { from_person_name?: string })[];
  notes: Note[];
}

// Supabase client type helper
export interface Database {
  public: {
    Tables: {
      people: { Row: Person; Insert: Partial<Person> & { name: string }; Update: Partial<Person> };
      notes: { Row: Note; Insert: Partial<Note> & { raw_text: string }; Update: Partial<Note> };
      gifts: { Row: Gift; Insert: Partial<Gift> & { person_id: string; text: string; kind: GiftKind }; Update: Partial<Gift> };
      note_people: { Row: NotePerson; Insert: NotePerson; Update: Partial<NotePerson> };
      connections: { Row: Connection; Insert: Partial<Connection> & { from_person: string; to_person: string }; Update: Partial<Connection> };
      reminders: { Row: Reminder; Insert: Partial<Reminder> & { text: string; due_date: string }; Update: Partial<Reminder> };
    };
  };
}
