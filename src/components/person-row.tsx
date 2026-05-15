"use client";

import Link from "next/link";
import { timeAgo } from "@/lib/helpers";
import type { Person } from "@/lib/database.types";

export function PersonRow({ person }: { person: Person }) {
  return (
    <Link
      href={`/person/${person.id}`}
      className="flex items-center justify-between py-4 px-4 -mx-4 rounded-xl transition-colors duration-300 hover:bg-paper-dark/50 active:bg-paper-dark min-h-[56px]"
    >
      <div className="flex-1 min-w-0">
        <p className="font-serif text-lg text-ink truncate">{person.name}</p>
        {person.where_they_are && (
          <p className="text-sm text-ink-faint italic truncate">
            {person.where_they_are}
          </p>
        )}
      </div>
      <span className="text-sm text-ink-faint font-hand ml-3 shrink-0">
        {person.last_seen_at ? timeAgo(person.last_seen_at) : "new"}
      </span>
    </Link>
  );
}
