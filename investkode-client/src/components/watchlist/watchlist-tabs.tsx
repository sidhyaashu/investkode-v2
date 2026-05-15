"use client";

import type { WatchlistTab } from "@/components/dynamic-view/types";
import { cn } from "@/lib/utils";
import { PlusIcon, StarIcon } from "@phosphor-icons/react";

const toneDotClass: Record<string, string> = {
  blue: "bg-[#2B6BFF]",
  green: "bg-[#10A37F]",
  yellow: "bg-[#E29A2B]",
  red: "bg-[#E2557A]",
  neutral: "bg-[var(--ik-ink-3)]",
};

export function WatchlistTabs({
  tabs,
  activeListId,
  onChange,
  onCreateList,
  allowNewList,
}: {
  tabs: WatchlistTab[];
  activeListId: string;
  onChange: (listId: string) => void;
  onCreateList?: () => void;
  allowNewList?: boolean;
}) {
  return (
    <section className="flex items-center gap-2 rounded-[14px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.45))] p-2 shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] dark:bg-[linear-gradient(180deg,rgba(28,28,32,0.74),rgba(20,20,23,0.54))]">
      <div className="flex flex-1 gap-[3px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = tab.id === activeListId;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[9px] border border-transparent px-[13px] py-2 font-sans text-[13px] font-medium tracking-[-0.005em] text-[var(--ik-ink-2)] transition",
                "hover:bg-white/65 hover:text-[var(--ik-ink)] dark:hover:bg-white/[0.05] dark:hover:text-white",
                active &&
                  "border-[rgba(43,107,255,0.24)] bg-[linear-gradient(135deg,rgba(43,107,255,0.14),rgba(92,141,255,0.08))] font-semibold text-[var(--ik-accent-deep)] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_2px_8px_-4px_rgba(43,107,255,0.3)] dark:border-white/20 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] dark:text-white"
              )}
            >
              {tab.id === "all" ? (
                <StarIcon size={13} />
              ) : (
                <span className={cn("inline-block size-2 rounded-[2px]", toneDotClass[tab.tone ?? "neutral"])} />
              )}

              {tab.label}

              <span
                className={cn(
                  "rounded-full bg-[rgba(91,114,160,0.14)] px-[7px] py-px font-mono text-[10.5px] font-semibold text-[var(--ik-ink-3)]",
                  active && "bg-[var(--ik-accent)] text-white dark:bg-[#F2F2F3] dark:text-[#0A0A0B]"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {allowNewList ? (
        <button
          type="button"
          onClick={onCreateList}
          className="inline-flex shrink-0 items-center gap-[7px] rounded-[9px] border border-dashed border-[var(--ik-rule)] px-[13px] py-2 font-sans text-[13px] font-medium text-[var(--ik-ink-3)] transition hover:border-[var(--ik-accent-2)] hover:bg-[var(--ik-accent-soft)] hover:text-[var(--ik-accent-deep)] dark:hover:border-white/25 dark:hover:bg-white/[0.04] dark:hover:text-white"
        >
          <PlusIcon size={13} weight="bold" />
          New list
        </button>
      ) : null}
    </section>
  );
}