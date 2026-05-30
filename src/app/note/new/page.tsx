"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mic, Save, Loader2, Check, Pencil, X, Link2, MessageSquarePlus, Bell } from "lucide-react";
import { GiftChip } from "@/components/gift-chip";
import type { NoteStructured } from "@/lib/database.types";

function formatReminderDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type Stage = "capture" | "thinking" | "confirm";

export default function NewNotePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-full"><p className="text-ink-faint animate-pulse">loading...</p></div>}>
      <NewNoteContent />
    </Suspense>
  );
}

function NewNoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteType = searchParams.get("type");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("capture");
  const [parsed, setParsed] = useState<NoteStructured | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeConfig = useMemo(() => {
    switch (noteType) {
      case "about":
        return {
          title: "about someone",
          placeholder: "I talked to Marcus today and learned he used to be a jazz drummer...",
          icon: <MessageSquarePlus className="w-4 h-4 text-terracotta" strokeWidth={2.5} />,
          hint: "who did you talk to? what did you learn about them?",
        };
      case "connection":
        return {
          title: "a connection",
          placeholder: "I think Lila and Marcus should meet — she's looking for music for her garden party and he plays drums...",
          icon: <Link2 className="w-4 h-4 text-ink-light" strokeWidth={2.5} />,
          hint: "who should meet? what's the connection?",
        };
      default:
        return {
          title: "new note",
          placeholder: "I ran into Marcus today at the corner store...",
          icon: null,
          hint: "tap the mic on your keyboard to talk",
        };
    }
  }, [noteType]);

  useEffect(() => {
    if (stage === "capture" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [stage]);

  const handleSaveNote = async () => {
    if (!text.trim()) return;
    setError(null);
    setStage("thinking");

    try {
      const res = await fetch("/api/parse-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text }),
      });

      if (!res.ok) {
        let msg = "Something went wrong saving your note. Please try again.";
        if (res.status === 401) msg = "Your session expired — please sign in again.";
        else if (res.status === 503) msg = "The notebook's database isn't connected yet.";
        else if (res.status >= 500)
          msg = "Couldn't reach the database — it may not be set up yet. Try again in a moment.";
        setError(msg);
        setStage("capture");
        return;
      }

      const data = await res.json();
      if (!data.structured) {
        setError("I saved the note but couldn't read it just now. Please try again.");
        setStage("capture");
        return;
      }
      setNoteId(data.note_id);
      setParsed(data.structured);
      setStage("confirm");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStage("capture");
    }
  };

  const handleConfirm = async () => {
    if (!noteId || !parsed) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id: noteId, structured: parsed }),
      });
      if (!res.ok) throw new Error("save failed");
      router.push("/");
    } catch {
      setError("Couldn't save your note. Please try again.");
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (noteId) {
      await fetch(`/api/notes?id=${noteId}`, { method: "DELETE" });
    }
    router.push("/");
  };

  if (stage === "thinking") {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin mb-4" strokeWidth={2} />
        <p className="font-hand text-xl text-ink-faint animate-pulse">
          listening to what you said...
        </p>
      </div>
    );
  }

  if (stage === "confirm" && parsed) {
    return (
      <div className="flex flex-col min-h-full">
        <header className="flex items-center gap-3 px-5 pt-6 pb-4">
          <button
            onClick={() => setStage("capture")}
            className="p-2 -m-2 text-ink-faint hover:text-ink"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <h1 className="font-serif text-xl text-ink">here&apos;s what I heard</h1>
        </header>

        <div className="flex-1 px-5 pb-6 space-y-4 overflow-y-auto">
          {parsed.people.map((person, i) => (
            <div
              key={i}
              className="bg-cream rounded-2xl p-5 shadow-[0_2px_8px_var(--color-warm-shadow)]"
              style={{ transform: `rotate(${(i % 2 === 0 ? -0.5 : 0.7)}deg)` }}
            >
              <p className="font-serif text-xl mb-1">
                {person.name}
                {!person.matched_id && (
                  <span className="font-hand text-base text-sage ml-2">new neighbor</span>
                )}
              </p>
              {person.where_they_are && (
                <p className="text-sm text-ink-faint italic mb-3">{person.where_they_are}</p>
              )}
              {person.gifts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {person.gifts.map((gift, j) => (
                    <GiftChip key={j} text={gift.text} kind={gift.kind} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {parsed.follow_ups && parsed.follow_ups.length > 0 && (
            <div className="bg-cream rounded-2xl p-5 shadow-[0_2px_8px_var(--color-warm-shadow)]">
              <p className="font-hand text-base text-ink-faint mb-3">follow-ups</p>
              <ul className="space-y-2">
                {parsed.follow_ups.map((f, i) => (
                  <li key={i} className="text-sm text-ink leading-relaxed">
                    <span className="text-ink-faint">•</span> {f.text}
                    {f.due_date && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-sage">
                        <Bell className="w-3 h-3" strokeWidth={2.5} />
                        {formatReminderDate(f.due_date)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {parsed.follow_ups.some((f) => f.due_date) && (
                <p className="text-xs text-ink-faint italic mt-3">
                  Reminders will arrive in your inbox the morning of.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-8 pt-2 flex gap-3">
          <button
            onClick={handleDiscard}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-ink/10 text-ink-faint font-medium transition-colors hover:bg-paper-dark"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
            Discard
          </button>
          <button
            onClick={() => setStage("capture")}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-ink/10 text-ink font-medium transition-colors hover:bg-paper-dark"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.5} />
            Edit
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-[1.5] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sage text-cream font-medium shadow-[0_2px_8px_rgba(122,155,109,0.3)] active:translate-y-[1px] transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Check className="w-5 h-5" strokeWidth={2.5} />
            )}
            Save
          </button>
        </div>
      </div>
    );
  }

  // Capture stage
  return (
    <div className="flex flex-col min-h-full">
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <button
          onClick={() => router.push("/")}
          className="p-2 -m-2 text-ink-faint hover:text-ink"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <h1 className="font-serif text-xl text-ink flex items-center gap-2">
          {typeConfig.icon}
          {typeConfig.title}
        </h1>
      </header>

      <div className="flex-1 px-5 py-3 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-ink-faint">
          <Mic className="w-4 h-4" strokeWidth={2.5} />
          <span className="font-hand text-base">{typeConfig.hint}</span>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={typeConfig.placeholder}
          className="flex-1 w-full bg-cream rounded-2xl p-5 text-ink text-base leading-relaxed resize-none placeholder:text-ink-faint/50 shadow-inner min-h-[200px] border border-ink/5"
        />
      </div>

      <div className="px-5 pb-8 pt-2">
        {error && (
          <p className="text-sm text-terracotta text-center mb-3">{error}</p>
        )}
        <button
          onClick={handleSaveNote}
          disabled={!text.trim()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-terracotta text-cream text-lg font-medium shadow-[0_2px_8px_rgba(196,105,74,0.3)] active:translate-y-[1px] transition-all disabled:opacity-40 disabled:shadow-none"
        >
          <Save className="w-5 h-5" strokeWidth={2.5} />
          Save Note
        </button>
      </div>
    </div>
  );
}
