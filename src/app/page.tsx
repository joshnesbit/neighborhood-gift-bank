"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Search, Users, LogIn, LogOut } from "lucide-react";
import { PersonRow } from "@/components/person-row";
import { useAuth } from "@/components/auth-provider";
import type { Person } from "@/lib/database.types";

type SortMode = "recent" | "unseen" | "alpha";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, configured, signOut } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("recent");

  const fetchPeople = useCallback(async () => {
    try {
      const res = await fetch(`/api/people?sort=${sort}`);
      if (res.ok) {
        const data = await res.json();
        setPeople(data);
      }
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  // Show login gate if not authenticated (skip gate if Supabase isn't configured yet)
  if (!authLoading && !user && configured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-8">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-terracotta" strokeWidth={2} />
            <h1 className="font-serif text-3xl font-semibold text-ink">
              Rover Notes
            </h1>
          </div>

          <p className="text-ink-faint text-sm mb-8 leading-relaxed">
            A personal notebook for tracking the gifts, dreams, and passions of
            your neighbors.
          </p>

          <button
            onClick={() => router.push("/login")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-terracotta text-cream font-medium shadow-[0_2px_8px_rgba(196,105,74,0.3)] active:translate-y-[1px] transition-all"
          >
            <LogIn className="w-5 h-5" strokeWidth={2.5} />
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-ink-faint font-hand text-lg animate-pulse">
          opening the notebook...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-ink flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-terracotta" strokeWidth={2.5} />
            Rover Notes
          </h1>
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              className="p-2 text-ink-faint hover:text-ink transition-colors"
            >
              <Search className="w-5 h-5" strokeWidth={2.5} />
            </Link>
            <button
              onClick={signOut}
              className="p-2 text-ink-faint hover:text-ink transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* New Note — the primary action */}
      <div className="px-5 py-4">
        <button
          onClick={() => router.push("/note/new")}
          className="w-full flex items-center justify-center gap-3 bg-terracotta text-cream rounded-2xl py-4 px-6 text-lg font-medium shadow-[0_2px_8px_rgba(196,105,74,0.3)] active:shadow-[0_1px_4px_rgba(196,105,74,0.2)] active:translate-y-[1px] transition-all duration-200"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
          New Note
        </button>
      </div>

      {/* People list */}
      <div className="flex-1 px-5 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-hand text-lg text-ink-faint flex items-center gap-1.5">
            <Users className="w-4 h-4" strokeWidth={2.5} />
            neighbors
          </h2>
          <div className="flex gap-1">
            {(["recent", "unseen", "alpha"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-hand transition-colors duration-200 ${
                  sort === mode
                    ? "bg-ink text-paper"
                    : "text-ink-faint hover:text-ink"
                }`}
              >
                {mode === "recent"
                  ? "recent"
                  : mode === "unseen"
                    ? "unseen"
                    : "a–z"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-ink-faint font-hand text-lg animate-pulse">
              opening the notebook...
            </p>
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-faint font-hand text-xl mb-2">
              No notes yet.
            </p>
            <p className="text-ink-faint text-sm">Go take a walk.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink/5">
            {people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
