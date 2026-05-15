"use client";

import type { GiftKind } from "@/lib/database.types";

const kindStyles: Record<GiftKind, string> = {
  head: "bg-amber-100/60 text-amber-900 border-amber-200/60",
  heart: "bg-rose-100/50 text-rose-900 border-rose-200/50",
  hand: "bg-sky-100/50 text-sky-900 border-sky-200/50",
  teachable: "bg-violet-100/50 text-violet-900 border-violet-200/50",
  dream: "bg-emerald-100/50 text-emerald-900 border-emerald-200/50",
};

const kindLabels: Record<GiftKind, string> = {
  head: "head",
  heart: "heart",
  hand: "hand",
  teachable: "teachable",
  dream: "dream",
};

export function GiftChip({
  text,
  kind,
  onClick,
}: {
  text: string;
  kind: GiftKind;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "span";
  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${kindStyles[kind]} transition-colors duration-300 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      <span className="font-hand text-sm opacity-60">{kindLabels[kind]}</span>
      <span>{text}</span>
    </Component>
  );
}
