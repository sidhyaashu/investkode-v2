"use client";

import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { DynamicView, DynamicRow } from "@/components/dynamic-view/types";
import { WatchlistKpiStrip } from "./watchlist-kpi-strip";
import { WatchlistTabs } from "./watchlist-tabs";
import { WatchlistTableCard } from "./watchlist-table-card";
import { ViewPagination } from "@/components/dynamic-view/pagination/view-pagination";
import { WatchlistActionModal, type StockSearchItem } from "./watchlist-action-modal";

const MOCK_UNIVERSE: StockSearchItem[] = [
  {
    ticker: "TCS",
    name: "Tata Consultancy Services",
    sector: "IT services",
    price: 3842.1,
    change: -0.42,
    color: ["#2B6BFF", "#5C8DFF"],
  },
  {
    ticker: "RELIANCE",
    name: "Reliance Industries",
    sector: "Energy",
    price: 2986.2,
    change: 0.78,
    color: ["#0B2545", "#5B72A0"],
  },
  {
    ticker: "BAJFINANCE",
    name: "Bajaj Finance",
    sector: "Banks & NBFC",
    price: 7420.8,
    change: 1.32,
    color: ["#E29A2B", "#FBBF24"],
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    sector: "Banks & NBFC",
    price: 1428.6,
    change: 2.04,
    color: ["#2B6BFF", "#5C8DFF"],
  },
  {
    ticker: "INFY",
    name: "Infosys",
    sector: "IT services",
    price: 1542.45,
    change: -1.2,
    color: ["#0B2545", "#5B72A0"],
  },
  {
    ticker: "ZOMATO",
    name: "Zomato Ltd",
    sector: "Consumer",
    price: 184.2,
    change: 3.45,
    color: ["#E2557A", "#FB7185"],
  },
];

export function WatchlistViewRenderer({ view }: { view: DynamicView }) {
  const [activeListId, setActiveListId] = useState(view.watchlist?.active_list_id ?? "all");
  const [tabs, setTabs] = useState(view.watchlist?.tabs ?? []);
  const [rows, setRows] = useState<DynamicRow[]>(view.data?.rows ?? []);
  const [query, setQuery] = useState("");
  const [actionModalMode, setActionModalMode] = useState<"add" | "create" | null>(null);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

  const watchlist = view.watchlist;
  const columns = view.columns ?? [];
  const pagination = view.pagination;

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = rows.filter((row) => {
      const listIds = row.meta?.list_ids ?? [];

      const listMatch =
        activeListId === "all" || listIds.includes(activeListId);

      const searchMatch =
        !q ||
        Object.values(row.values).some((value) =>
          String(value ?? "").toLowerCase().includes(q)
        );

      return listMatch && searchMatch;
    });

    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = a.values[sortKey];
        const bVal = b.values[sortKey];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal > bVal ? 1 : -1;
        return sortDir === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [rows, activeListId, query, sortKey, sortDir]);

  const activeTabLabel =
    tabs.find((tab) => tab.id === activeListId)?.label ?? "All stocks";

  function handleActionModalFinish(data: {
    mode: "add" | "create";
    name?: string;
    type?: any;
    instruments: StockSearchItem[];
    targetWatchlistId?: string;
  }) {
    if (data.mode === "create") {
      const newListId = `wl_user_${Date.now()}`;
      const newTab = {
        id: newListId,
        label: data.name || "New List",
        count: data.instruments.length,
        type: data.type || "custom",
        source: "user" as const,
      };

      setTabs((prev) => [...prev, newTab]);

      const newRows = data.instruments.map((stock) => createRow(stock, [newListId]));
      setRows((prev) => [...newRows, ...prev]);

      setActiveListId(newListId);
      toast.success(`Created list "${data.name}" with ${data.instruments.length} stocks`);
    } else {
      const targetId = data.targetWatchlistId || activeListId;

      setRows((prev) => {
        const next = [...prev];
        data.instruments.forEach((stock) => {
          const existing = next.find((r) => r.values.symbol === stock.ticker);
          if (existing) {
            existing.meta = {
              ...existing.meta,
              list_ids: Array.from(new Set([...(existing.meta?.list_ids ?? []), targetId])),
            };
          } else {
            next.unshift(createRow(stock, [targetId]));
          }
        });
        return next;
      });

      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === targetId ? { ...tab, count: tab.count + data.instruments.length } : tab
        )
      );

      toast.success(`Added ${data.instruments.length} stocks to watchlist`);
    }
    setActionModalMode(null);
  }

  function createRow(stock: StockSearchItem, listIds: string[]): DynamicRow {
    const low = stock.price * 0.88;
    const high = stock.price * 1.1;

    return {
      id: `${stock.ticker.toLowerCase()}_${Date.now()}`,
      values: {
        company_name: stock.name,
        symbol: stock.ticker,
        exchange: "NSE",
        last_price: stock.price,
        change_percent: stock.change,
        low_52w: low,
        high_52w: high,
        market_cap: "—",
        pe: "—",
        sector: stock.sector,
      },
      meta: {
        list_ids: listIds,
        draggable: true,
        logo: {
          type: "initials",
          label: stock.ticker.slice(0, 2).toUpperCase(),
          variant: "default",
        },
      },
      _row: {
        expandable: true,
        expansion_key: "company_snapshot",
      },
    };
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

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
              Stocks you're tracking, organised your way. Click any name to dive into the full brief — price action, fundamentals, AI verdict.
            </p>
          </div>
        </section>

        {watchlist?.kpis?.length ? (
          <WatchlistKpiStrip cards={watchlist.kpis} />
        ) : null}

        <section className="flex items-center gap-2.5 rounded-[14px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.60))] py-1.5 pl-4 pr-1.5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_20px_-8px_rgba(43,69,112,0.18)] transition focus-within:border-[var(--ik-accent-2)] focus-within:shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_20px_-8px_rgba(43,107,255,0.32),0_0_0_4px_var(--ik-accent-soft)] dark:bg-[linear-gradient(180deg,rgba(28,28,32,0.88),rgba(20,20,23,0.70))]">
          <MagnifyingGlass size={16} className="shrink-0 text-[var(--ik-ink-3)]" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setActionModalMode("add");
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setActionModalMode("add");
              }
            }}
            placeholder="Search your watchlist or add a stock — e.g. TCS, Reliance, Bajaj Finance…"
            className="min-w-0 flex-1 bg-transparent py-2.5 font-sans text-sm text-[var(--ik-ink)] outline-none placeholder:text-[var(--ik-ink-4)]"
          />

          <span className="rounded-md border border-[var(--ik-rule)] bg-white/70 px-[7px] py-0.5 font-mono text-[10.5px] font-medium text-[var(--ik-ink-3)] dark:bg-white/[0.06]">
            ⌘K
          </span>

          {watchlist?.allow_add_stock ? (
            <button
              type="button"
              onClick={() => setActionModalMode("add")}
              className="inline-flex items-center gap-[7px] rounded-[10px] border-0 bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] px-3.5 py-2.5 font-sans text-[13px] font-semibold tracking-[-0.005em] text-white shadow-[0_4px_12px_-2px_rgba(43,107,255,0.45)] transition hover:translate-y-[-1px] dark:text-black"
            >
              <Plus size={14} weight="bold" />
              Add stock
            </button>
          ) : null}
        </section>

        {tabs?.length ? (
          <WatchlistTabs
            tabs={tabs.map((tab) =>
              tab.id === "all" ? { ...tab, count: rows.length } : tab
            )}
            activeListId={activeListId}
            onChange={setActiveListId}
            allowNewList={watchlist?.allow_new_list}
            onCreateList={() => setActionModalMode("create")}
          />
        ) : null}

        <WatchlistTableCard
          title={activeListId === "all" ? "All stocks" : activeTabLabel}
          rows={visibleRows}
          columns={columns}
          lists={tabs}
          allowExport={watchlist?.allow_export}
          allowAddStock={watchlist?.allow_add_stock}
          allowDragReorder={watchlist?.allow_drag_reorder}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onAddStock={() => setActionModalMode("add")}
          onReset={() => {
            setQuery("");
            setActiveListId("all");
            setSortKey(null);
            setSortDir(null);
            toast.success("Watchlist view reset");
          }}
          onRowsReorder={(nextVisibleRows) => {
            const visibleIds = new Set(visibleRows.map((row) => row.id));
            const hiddenRows = rows.filter((row) => !visibleIds.has(row.id));
            setRows([...nextVisibleRows, ...hiddenRows]);
            toast.success("Manual order updated");
          }}
        />

        {pagination && pagination.total_pages > 1 ? (
          <ViewPagination
            page={pagination.page}
            totalPages={pagination.total_pages}
            onPrevious={() => {}}
            onNext={() => {}}
          />
        ) : null}
      </div>

      {actionModalMode ? (
        <WatchlistActionModal
          mode={actionModalMode}
          onClose={() => setActionModalMode(null)}
          lists={tabs}
          presets={watchlist?.presets ?? []}
          universe={MOCK_UNIVERSE}
          trackedTickers={rows.map((row) => String(row.values.symbol))}
          onFinish={handleActionModalFinish}
          initialWatchlistId={activeListId === "all" ? undefined : activeListId}
        />
      ) : null}
    </>
  );
}