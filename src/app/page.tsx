"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  LogIn,
  LogOut,
  X,
} from "lucide-react";
import { PersonRow } from "@/components/person-row";
import { useAuth } from "@/components/auth-provider";
import type { Person } from "@/lib/database.types";

type SortMode = "recent" | "past" | "alpha";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, configured, signOut } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("recent");
  const [quickSearch, setQuickSearch] = useState("");
  const [browsing, setBrowsing] = useState(false);

  const fetchPeople = useCallback(async (sortMode: SortMode) => {
    try {
      const res = await fetch(`/api/people?sort=${sortMode}`);
      if (res.ok) {
        const data = await res.json();
        setPeople(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPeople(sort);
  }, [sort, fetchPeople]);

  const showList = browsing || !!quickSearch.trim();

  const filtered = useMemo(() => {
    if (!quickSearch.trim()) return people;
    const q = quickSearch.toLowerCase();
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.where_they_are && p.where_they_are.toLowerCase().includes(q))
    );
  }, [people, quickSearch]);

  const handleBrowse = (mode: SortMode) => {
    setSort(mode);
    setBrowsing(true);
  };

  const handleCloseBrowse = () => {
    setBrowsing(false);
    setQuickSearch("");
  };

  // Auth gate
  if (!authLoading && !user && configured) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-8">
        <div className="w-full max-w-sm text-center">
          <BookOpen className="w-10 h-10 text-terracotta mx-auto mb-4" strokeWidth={2} />
          <h1 className="font-serif text-2xl font-semibold text-ink mb-1">
            Outer Sunset
          </h1>
          <h2 className="font-serif text-lg text-ink-light mb-6">
            Neighborhood Gift Bank
          </h2>
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
      <div className="flex items-center justify-center flex-1">
        <p className="text-ink-faint text-lg animate-pulse">
          opening the notebook...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <header className="px-5 pt-6 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-terracotta" strokeWidth={2.5} />
              Outer Sunset
            </h1>
            <p className="text-sm text-ink-light ml-7">Neighborhood Gift Bank</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-ink-faint hover:text-ink transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Primary actions — positioned in the thumb zone */}
      <div className="flex-1 flex flex-col justify-end px-5 pb-16">
        <p className="text-center text-ink-faint text-sm mb-8">
          {people.length > 0
            ? `${people.length} ${people.length === 1 ? "neighbor" : "neighbors"} in your notebook`
            : "Go take a walk."}
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/note/new")}
            className="w-full flex items-center justify-center gap-3 bg-terracotta text-cream rounded-2xl py-5 px-6 text-lg font-medium shadow-[0_2px_8px_rgba(196,105,74,0.3)] active:shadow-[0_1px_4px_rgba(196,105,74,0.2)] active:translate-y-[1px] transition-all duration-200"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
            Add a Note
          </button>

          <button
            onClick={() => handleBrowse("recent")}
            className="w-full flex items-center justify-center gap-3 bg-sage text-cream rounded-2xl py-5 px-6 text-lg font-medium shadow-[0_2px_8px_rgba(122,155,109,0.3)] active:shadow-[0_1px_4px_rgba(122,155,109,0.2)] active:translate-y-[1px] transition-all duration-200"
          >
            <Search className="w-6 h-6" strokeWidth={2.5} />
            Find a Neighbor
          </button>
        </div>
      </div>

      {/* Neighbor browser — slides up when active */}
      {showList && (
        <div className="fixed inset-0 bg-paper flex flex-col z-10">
          <header className="flex items-center gap-3 px-5 pt-safe pb-2">
            <button
              onClick={handleCloseBrowse}
              className="p-2 -m-2 text-ink-faint hover:text-ink"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <h1 className="font-serif text-xl text-ink">neighbors</h1>
          </header>

          {/* Search */}
          <div className="px-5 pt-2 pb-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" strokeWidth={2.5} />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="search by name or place..."
                autoFocus
                className="w-full bg-cream rounded-xl py-3 pl-10 pr-4 text-base text-ink placeholder:text-ink-faint/50 border border-ink/5"
              />
              {quickSearch && (
                <button
                  onClick={() => setQuickSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink text-sm"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {/* Sort tabs */}
          <div className="px-5 pt-2 pb-1 flex items-center justify-between">
            <p className="text-sm text-ink-faint">
              {quickSearch
                ? `${filtered.length} ${filtered.length === 1 ? "match" : "matches"}`
                : `${people.length} ${people.length === 1 ? "neighbor" : "neighbors"}`}
            </p>
            <div className="flex gap-1">
              {(["recent", "past", "alpha"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleBrowse(mode)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                    sort === mode
                      ? "bg-ink text-paper"
                      : "text-ink-faint hover:text-ink"
                  }`}
                >
                  {mode === "recent"
                    ? "recent"
                    : mode === "past"
                      ? "past"
                      : "a–z"}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 px-5 pt-2 pb-safe overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-ink-faint text-base animate-pulse">
                  opening the notebook...
                </p>
              </div>
            ) : filtered.length === 0 && quickSearch ? (
              <div className="text-center py-8">
                <p className="text-ink-faint text-base">
                  no one matching &ldquo;{quickSearch}&rdquo;
                </p>
                <Link
                  href={`/search?q=${encodeURIComponent(quickSearch)}`}
                  className="text-terracotta text-sm underline mt-2 inline-block"
                >
                  search notes too
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-ink/5">
                {filtered.map((person) => (
                  <PersonRow key={person.id} person={person} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
