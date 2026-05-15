"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Save, Loader2, Check, Pencil, X } from "lucide-react";
import { GiftChip } from "@/components/gift-chip";
import type { NoteStructured, GiftKind } from "@/lib/database.types";

type Stage = "capture" | "thinking" | "confirm";

export default function NewNotePage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("capture");
  const [parsed, setParsed] = useState<NoteStructured | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stage === "capture" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [stage]);

  const handleSaveNote = async () => {
    if (!text.trim()) return;
    setStage("thinking");

    try {
      const res = await fetch("/api/parse-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text }),
      });

      if (!res.ok) throw new Error("Failed to parse");

      const data = await res.json();
      setNoteId(data.note_id);
      setParsed(data.structured);
      setStage("confirm");
    } catch {
      setStage("capture");
    }
  };

  const handleConfirm = async () => {
    if (!noteId || !parsed) return;
    setSaving(true);

    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id: noteId, structured: parsed }),
      });
      router.push("/");
    } catch {
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
              <p className="font-hand text-base text-ink-faint mb-2">follow-ups</p>
              <ul className="space-y-1">
                {parsed.follow_ups.map((f, i) => (
                  <li key={i} className="text-sm text-ink">• {f}</li>
                ))}
              </ul>
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
        <h1 className="font-serif text-xl text-ink">new note</h1>
      </header>

      <div className="flex-1 px-5 py-3 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-ink-faint">
          <Mic className="w-4 h-4" strokeWidth={2.5} />
          <span className="font-hand text-base">tap the mic on your keyboard to talk</span>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I ran into Marcus today at the corner store..."
          className="flex-1 w-full bg-cream rounded-2xl p-5 text-ink text-base leading-relaxed resize-none placeholder:text-ink-faint/50 shadow-inner min-h-[200px] border border-ink/5"
        />
      </div>

      <div className="px-5 pb-8 pt-2">
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
