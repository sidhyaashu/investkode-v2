"use client";

import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import type {
  DynamicView,
  SortDirection,
} from "@/components/dynamic-view/types";
import { WatchlistKpiStrip } from "./watchlist-kpi-strip";
import { WatchlistTabs } from "./watchlist-tabs";
import { WatchlistTableCard } from "./watchlist-table-card";
import { WatchlistActionModal } from "./watchlist-action-modal";

export function WatchlistViewRenderer({
  view,
  activeListId,
  onListChange,
  searchQuery,
  onSearchChange,
  sortKey,
  sortDir,
  onSortChange,
}: {
  view: DynamicView;
  activeListId?: string;
  onListChange?: (listId: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  sortKey?: string;
  sortDir?: SortDirection;
  onSortChange?: (key: string) => void;
  filters?: Record<string, string | undefined>;
  onFiltersChange?: (filters: Record<string, string | undefined>) => void;
}) {
  const [actionModalMode, setActionModalMode] =
    useState<"add" | "create" | null>(null);


  const rows = view.data?.rows ?? [];
  const columns = view.columns ?? [];
  const watchlist = view.watchlist;

  const currentListId =
    activeListId ?? watchlist?.active_list_id ?? "all";

  const activeTabLabel =
    watchlist?.tabs.find((tab) => tab.id === currentListId)?.label ??
    "All stocks";

  return (
    <>
      <div className="flex flex-col gap-[18px]">
        <section className="flex items-end justify-between gap-6">
          <div>
            <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--ik-ink-3)]">
              Home / Watchlist
            </div>
            <h1 className="font-sans text-[34px] font-bold tracking-[-0.025em] text-[var(--ik-ink)]">
              My Watchlist
            </h1>
            <p className="mt-1.5 max-w-[540px] font-sans text-[13.5px] leading-6 text-[var(--ik-ink-3)]">
              Stocks you're tracking, organised your way.
            </p>
          </div>
        </section>

        {watchlist?.kpis?.length ? (
          <WatchlistKpiStrip cards={watchlist.kpis} />
        ) : null}

        <section className="flex items-center gap-2.5 rounded-[14px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.60))] py-1.5 pl-4 pr-1.5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_20px_-8px_rgba(43,69,112,0.18)] transition focus-within:border-[var(--ik-accent-2)] dark:bg-[linear-gradient(180deg,rgba(28,28,32,0.88),rgba(20,20,23,0.70))]">
          <MagnifyingGlass size={16} className="shrink-0 text-[var(--ik-ink-3)]" />

          <input
            value={searchQuery ?? ""}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search your watchlist..."
            className="min-w-0 flex-1 bg-transparent py-2.5 font-sans text-sm text-[var(--ik-ink)] outline-none placeholder:text-[var(--ik-ink-4)]"
          />

          {watchlist?.allow_add_stock ? (
            <button
              type="button"
              onClick={() => setActionModalMode("add")}
              className="inline-flex items-center gap-[7px] rounded-[10px] border-0 bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] px-3.5 py-2.5 font-sans text-[13px] font-semibold text-white shadow-[0_4px_12px_-2px_rgba(43,107,255,0.45)] transition hover:translate-y-[-1px] dark:text-black"
            >
              <Plus size={14} weight="bold" />
              Add stock
            </button>
          ) : null}
        </section>

        {watchlist?.tabs?.length ? (
          <WatchlistTabs
            tabs={watchlist.tabs}
            activeListId={currentListId}
            onChange={(id) => onListChange?.(id)}
            allowNewList={watchlist.allow_new_list}
            onCreateList={() => setActionModalMode("create")}
          />
        ) : null}

        <WatchlistTableCard
          title={currentListId === "all" ? "All stocks" : activeTabLabel}
          rows={rows}
          columns={columns}
          allowExport={watchlist?.allow_export}
          allowAddStock={watchlist?.allow_add_stock}
          allowDragReorder={watchlist?.allow_drag_reorder}
          onAddStock={() => setActionModalMode("add")}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSortChange}
        />
      </div>

      {actionModalMode ? (
        <WatchlistActionModal
          mode={actionModalMode}
          onClose={() => setActionModalMode(null)}
          initialWatchlistId={currentListId === "all" ? undefined : currentListId}
          lists={watchlist?.tabs ?? []}
          presets={watchlist?.presets ?? []}
        />
      ) : null}
    </>
  );
}