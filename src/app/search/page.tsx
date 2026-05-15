"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { PersonRow } from "@/components/person-row";
import { GiftChip } from "@/components/gift-chip";
import { formatDate } from "@/lib/helpers";
import type { Person, GiftKind } from "@/lib/database.types";

interface SearchResults {
  people: Person[];
  gifts: { person_id: string; text: string; kind: GiftKind }[];
  notes: { id: string; raw_text: string; recorded_at: string }[];
}

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    search(value);
  };

  const hasResults =
    results &&
    (results.people.length > 0 ||
      results.notes.length > 0);

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 -m-2 text-ink-faint hover:text-ink"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>

          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" strokeWidth={2.5} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="search names, gifts, notes..."
              className="w-full bg-cream rounded-xl py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint/50 border border-ink/5"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 pb-8">
        {loading && (
          <p className="text-ink-faint font-hand text-sm mt-4 animate-pulse">
            searching...
          </p>
        )}

        {!loading && query && !hasResults && (
          <div className="text-center py-12">
            <p className="text-ink-faint font-hand text-lg">
              nothing found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {results && results.people.length > 0 && (
          <div className="mt-4">
            <h3 className="font-hand text-base text-ink-faint mb-1">people</h3>
            <div className="divide-y divide-ink/5">
              {results.people.map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </div>
          </div>
        )}

        {results && results.notes.length > 0 && (
          <div className="mt-6">
            <h3 className="font-hand text-base text-ink-faint mb-2">notes</h3>
            <div className="space-y-3">
              {results.notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-cream rounded-2xl p-4 border border-ink/5"
                >
                  <p className="font-hand text-sm text-ink-faint mb-1">
                    {formatDate(note.recorded_at)}
                  </p>
                  <p className="text-sm text-ink leading-relaxed line-clamp-3">
                    {note.raw_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-ink-faint font-hand text-lg">
              type to search across everyone
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
