"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  DotsThreeVertical,
  Trash,
} from "@phosphor-icons/react";
import type { DynamicRow } from "@/components/dynamic-view/types";
import { cn } from "@/lib/utils";

const LISTS = [
  { id: "core", label: "Core holdings", tone: "blue" },
  { id: "it", label: "IT services", tone: "green" },
  { id: "banks", label: "Banks & NBFC", tone: "yellow" },
  { id: "spec", label: "Speculative", tone: "red" },
];

const dotClass: Record<string, string> = {
  blue: "bg-[#2B6BFF]",
  green: "bg-[#10A37F]",
  yellow: "bg-[#E29A2B]",
  red: "bg-[#E2557A]",
};

export function WatchlistRowActions({ row }: { row: DynamicRow }) {
  const [open, setOpen] = useState(false);

  const symbol = String(row.values.symbol ?? row.id);
  const currentLists = row.meta?.list_ids ?? [];

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/stocks/${symbol}`}
        className="grid size-7 place-items-center rounded-lg border border-[var(--ik-rule)] bg-white/50 text-[var(--ik-ink-2)] transition hover:border-[var(--ik-accent-2)] hover:bg-white/80 hover:text-[var(--ik-accent-deep)] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:hover:text-white"
        title="Open detail"
      >
        <ArrowRight size={14} />
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="grid size-7 place-items-center rounded-lg border border-[var(--ik-rule)] bg-white/50 text-[var(--ik-ink-2)] transition hover:border-[var(--ik-accent-2)] hover:bg-white/80 hover:text-[var(--ik-accent-deep)] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:hover:text-white"
          title="Move to list"
        >
          <DotsThreeVertical size={15} weight="bold" />
        </button>

        {open ? (
          <div className="absolute right-0 top-9 z-30 w-[210px] overflow-hidden rounded-[12px] border border-[var(--ik-glass-border)] bg-white/95 p-1.5 shadow-[0_16px_40px_-16px_rgba(43,69,112,0.40)] backdrop-blur-xl dark:bg-[#1A1A1D]/95 dark:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.75)]">
            <div className="px-2.5 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
              Move to list
            </div>

            {LISTS.map((list) => {
              const selected = currentLists.includes(list.id);

              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => {
                    /**
                     * Later call:
                     * PATCH /api/v1/watchlists/items/{row.id}/move
                     */
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-sans text-[12.5px] text-[var(--ik-ink-2)] transition hover:bg-[var(--ik-accent-soft)] hover:text-[var(--ik-ink)] dark:hover:bg-white/[0.05]",
                    selected && "font-semibold text-[var(--ik-accent-deep)] dark:text-white"
                  )}
                >
                  <span className={cn("size-2 rounded-full", dotClass[list.tone])} />
                  <span className="flex-1">{list.label}</span>
                  {selected ? <Check size={12} weight="bold" /> : null}
                </button>
              );
            })}

            <div className="my-1 h-px bg-[var(--ik-rule)]" />

            <Link
              href={`/stocks/${symbol}`}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-sans text-[12.5px] text-[var(--ik-ink-2)] transition hover:bg-[var(--ik-accent-soft)] hover:text-[var(--ik-ink)] dark:hover:bg-white/[0.05]"
            >
              <ArrowRight size={13} />
              Open detail
            </Link>

            <button
              type="button"
              onClick={() => {
                /**
                 * Later call:
                 * DELETE /api/v1/watchlists/items/{row.id}
                 */
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-sans text-[12.5px] text-[var(--ik-danger-deep)] transition hover:bg-[var(--ik-danger-soft)]"
            >
              <Trash size={13} />
              Remove from watchlist
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
