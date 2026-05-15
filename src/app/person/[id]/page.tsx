"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Lightbulb,
  Loader2,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { GiftChip } from "@/components/gift-chip";
import { timeAgo, formatDate, GIFT_LABELS, GIFT_DESCRIPTIONS } from "@/lib/helpers";
import type { PersonWithDetails, GiftKind } from "@/lib/database.types";

const GIFT_ORDER: GiftKind[] = ["head", "heart", "hand", "teachable", "dream"];

export default function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [person, setPerson] = useState<PersonWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<string | null>(null);
  const [loadingReminders, setLoadingReminders] = useState(false);

  useEffect(() => {
    fetch(`/api/people/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPerson(data);
        setLoading(false);
      });
  }, [id]);

  const handleRemember = async () => {
    setReminders(null);
    setLoadingReminders(true);
    try {
      const res = await fetch("/api/remember", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: id }),
      });
      const data = await res.json();
      setReminders(data.reminders);
    } finally {
      setLoadingReminders(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-ink-faint font-hand text-lg animate-pulse">
          finding the page...
        </p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5">
        <p className="text-ink-faint font-hand text-lg">
          couldn&apos;t find this person
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-terracotta underline"
        >
          go home
        </button>
      </div>
    );
  }

  const giftsByKind = GIFT_ORDER.reduce(
    (acc, kind) => {
      const filtered = person.gifts.filter((g) => g.kind === kind);
      if (filtered.length > 0) acc[kind] = filtered;
      return acc;
    },
    {} as Record<GiftKind, typeof person.gifts>
  );

  const allConnections = [
    ...person.connections_from.map((c) => ({
      text: `pointed toward ${c.to_person_name || "someone"}`,
      reason: c.reason,
      status: c.status,
    })),
    ...person.connections_to.map((c) => ({
      text: `${c.from_person_name || "someone"} pointed here`,
      reason: c.reason,
      status: c.status,
    })),
  ];

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <header className="px-5 pt-6 pb-2">
        <button
          onClick={() => router.push("/")}
          className="p-2 -m-2 text-ink-faint hover:text-ink mb-2"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <h1 className="font-serif text-3xl font-semibold text-ink mt-2">
          {person.name}
        </h1>

        {person.where_they_are && (
          <p className="text-ink-faint italic mt-1">{person.where_they_are}</p>
        )}

        <div className="flex items-center gap-4 mt-2 text-sm text-ink-faint">
          {person.last_seen_at && (
            <span className="font-hand">
              last seen {timeAgo(person.last_seen_at)}
            </span>
          )}
          {person.first_met_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
              {formatDate(person.first_met_at)}
            </span>
          )}
        </div>
      </header>

      {/* What should I remember? */}
      <div className="px-5 mt-4">
        {!reminders && !loadingReminders && (
          <button
            onClick={handleRemember}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream border border-ink/5 text-sm text-ink-light hover:bg-paper-dark transition-colors"
          >
            <Lightbulb className="w-4 h-4 text-terracotta" strokeWidth={2.5} />
            <span className="font-hand">what should I remember?</span>
          </button>
        )}
        {loadingReminders && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cream border border-ink/5">
            <Loader2 className="w-4 h-4 animate-spin text-terracotta" strokeWidth={2} />
            <span className="font-hand text-base text-ink-faint">thinking...</span>
          </div>
        )}
        {reminders && (
          <div
            className="bg-cream rounded-2xl p-5 border border-ink/5 shadow-[0_2px_8px_var(--color-warm-shadow)]"
            style={{ transform: "rotate(-0.5deg)" }}
          >
            <p className="font-hand text-sm text-ink-faint mb-2">before you talk to {person.name}...</p>
            <div className="text-sm text-ink leading-relaxed whitespace-pre-line">
              {reminders}
            </div>
            <button
              onClick={() => setReminders(null)}
              className="mt-3 text-xs text-ink-faint hover:text-ink"
            >
              dismiss
            </button>
          </div>
        )}
      </div>

      {/* Gifts */}
      {Object.keys(giftsByKind).length > 0 && (
        <div className="px-5 mt-6">
          {Object.entries(giftsByKind).map(([kind, gifts]) => (
            <div key={kind} className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="font-hand text-base text-ink-faint">
                  {GIFT_LABELS[kind]}
                </h3>
                <span className="text-xs text-ink-faint/50">
                  {GIFT_DESCRIPTIONS[kind]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {gifts.map((gift) => (
                  <GiftChip
                    key={gift.id}
                    text={gift.text}
                    kind={gift.kind as GiftKind}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connections */}
      {allConnections.length > 0 && (
        <div className="px-5 mt-6">
          <h3 className="font-hand text-base text-ink-faint mb-2">connections</h3>
          <div className="space-y-2">
            {allConnections.map((conn, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm bg-cream rounded-xl px-4 py-3 border border-ink/5"
              >
                <ArrowRight className="w-4 h-4 text-sage mt-0.5 shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-ink">{conn.text}</p>
                  {conn.reason && (
                    <p className="text-ink-faint text-xs mt-0.5">{conn.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {person.notes.length > 0 && (
        <div className="px-5 mt-6">
          <h3 className="font-hand text-base text-ink-faint mb-2">notes</h3>
          <div className="space-y-3">
            {person.notes.map((note) => (
              <div
                key={note.id}
                className="bg-cream rounded-2xl p-4 border border-ink/5"
              >
                <p className="font-hand text-sm text-ink-faint mb-2">
                  {formatDate(note.recorded_at)}
                </p>
                <p className="text-sm text-ink leading-relaxed">
                  {note.raw_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
