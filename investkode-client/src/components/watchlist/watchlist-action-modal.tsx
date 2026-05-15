"use client";

import { MagnifyingGlass, Plus, X, Check, ListPlus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type StockSearchItem = {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  color: [string, string];
};

export function WatchlistActionModal({
  mode,
  onClose,
  universe,
  trackedTickers,
  onAdd,
  initialWatchlistId,
}: {
  mode: "add" | "create";
  onClose: () => void;
  universe: StockSearchItem[];
  trackedTickers: string[];
  onAdd: (stock: StockSearchItem) => void;
  initialWatchlistId?: string;
}) {
  const [query, setQuery] = useState("");
  const [listName, setListName] = useState("");

  const tracked = useMemo(() => new Set(trackedTickers), [trackedTickers]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return universe.slice(0, 6);

    return universe
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.ticker.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, universe]);

  function handleCreateList() {
    // Placeholder for list creation logic
    console.log("Creating list:", listName);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(11,37,69,0.32)] px-[18px] pt-20 backdrop-blur-md dark:bg-black/65"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[580px] overflow-hidden rounded-[18px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,#fff,#FAFCFF)] shadow-[0_24px_60px_-10px_rgba(43,69,112,0.4),0_1px_0_rgba(255,255,255,0.7)_inset] dark:bg-[linear-gradient(180deg,#1A1A1D,#131316)] dark:shadow-[0_24px_60px_-10px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.04)_inset]">
        <div className="flex items-center justify-between border-b border-[var(--ik-rule)] px-[18px] py-4">
          <div className="flex items-center gap-2 font-sans text-[15px] font-semibold text-[var(--ik-ink)]">
            {mode === "add" ? (
              <>
                <MagnifyingGlass size={16} className="text-[var(--ik-accent-deep)]" />
                Add stock to watchlist
              </>
            ) : (
              <>
                <ListPlus size={16} className="text-[var(--ik-accent-deep)]" />
                Create new watchlist
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-lg text-[var(--ik-ink-3)] hover:bg-[var(--ik-rule-2)] hover:text-[var(--ik-ink)] dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {mode === "add" ? (
          <>
            <div className="border-b border-[var(--ik-rule-2)] px-[18px] py-3.5">
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--ik-rule)] bg-[rgba(91,114,160,0.07)] px-3.5 py-2.5 focus-within:border-[var(--ik-accent-2)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_var(--ik-accent-soft)] dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
                <MagnifyingGlass size={15} className="text-[var(--ik-ink-3)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") onClose();

                    if (event.key === "Enter") {
                      const first = results.find((item) => !tracked.has(item.ticker));
                      if (first) onAdd(first);
                    }
                  }}
                  placeholder="Search NSE / BSE — type a name or ticker"
                  className="flex-1 bg-transparent font-sans text-sm text-[var(--ik-ink)] outline-none placeholder:text-[var(--ik-ink-4)]"
                />
              </div>

              <div className="mt-2 font-mono text-[11px] tracking-[0.06em] text-[var(--ik-ink-3)]">
                Press <b>Enter</b> to add the top match · <b>Esc</b> to close
              </div>
            </div>

            <div className="max-h-[340px] overflow-y-auto p-1.5">
              {results.length ? (
                <>
                  <div className="px-3 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
                    {query ? "Matches" : "Suggested"}
                  </div>

                  {results.map((stock) => {
                    const isTracked = tracked.has(stock.ticker);

                    return (
                      <button
                        key={stock.ticker}
                        type="button"
                        disabled={isTracked}
                        onClick={() => onAdd(stock)}
                        className={cn(
                          "grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-left transition hover:bg-[var(--ik-accent-soft)] dark:hover:bg-white/[0.05]",
                          isTracked && "cursor-default opacity-80"
                        )}
                      >
                        <div
                          className="grid size-[30px] place-items-center rounded-lg text-[10.5px] font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${stock.color[0]}, ${stock.color[1]})`,
                          }}
                        >
                          {stock.ticker.slice(0, 2)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-sans text-[13px] font-semibold text-[var(--ik-ink)]">
                            {stock.name}
                          </div>
                          <div className="mt-px font-mono text-[11px] text-[var(--ik-ink-3)]">
                            {stock.ticker} · {stock.sector}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-xs font-semibold text-[var(--ik-ink)]">
                            ₹{stock.price.toLocaleString("en-IN")}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 inline-flex rounded-full px-1.5 py-px font-mono text-[10.5px] font-semibold",
                              stock.change >= 0
                                ? "bg-[var(--ik-good-soft)] text-[var(--ik-good)]"
                                : "bg-[var(--ik-danger-soft)] text-[var(--ik-danger-deep)]"
                            )}
                          >
                            {stock.change >= 0 ? "+" : ""}
                            {stock.change.toFixed(2)}%
                          </div>
                        </div>

                        {isTracked ? (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--ik-good)]">
                            <Check size={12} weight="bold" />
                            Added
                          </div>
                        ) : (
                          <div className="grid size-[30px] place-items-center rounded-lg bg-[var(--ik-accent-soft)] text-[var(--ik-accent-deep)] group-hover:bg-[var(--ik-accent)]">
                            <Plus size={14} weight="bold" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </>
              ) : (
                <div className="px-5 py-9 text-center font-sans text-[13px] text-[var(--ik-ink-3)]">
                  No stocks found for “{query}”.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-6">
            <div className="mb-4">
              <label className="mb-2 block font-sans text-xs font-semibold uppercase tracking-wider text-[var(--ik-ink-3)]">
                List Name
              </label>
              <input
                autoFocus
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g. My Portfolio, Bluechips, Speculative..."
                className="w-full rounded-[10px] border border-[var(--ik-rule)] bg-[rgba(91,114,160,0.07)] px-3.5 py-2.5 font-sans text-sm text-[var(--ik-ink)] outline-none focus:border-[var(--ik-accent-2)] focus:bg-white focus:shadow-[0_0_0_3px_var(--ik-accent-soft)] dark:bg-white/[0.04] dark:focus:bg-white/[0.06]"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateList}
              disabled={!listName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] py-3 font-sans text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(43,107,255,0.45)] transition hover:translate-y-[-1px] disabled:opacity-50 dark:text-black"
            >
              <Plus size={16} weight="bold" />
              Create List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
