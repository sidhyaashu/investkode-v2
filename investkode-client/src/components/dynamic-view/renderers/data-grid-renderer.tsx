"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DynamicView, SortDirection } from "../types";
import { RenderCell } from "../registry/cell-renderer-registry";
import { cn } from "@/lib/utils";
import { MagnifyingGlassIcon, StarIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

export function DataGridRenderer({
  view,
  sortKey,
  sortDir,
  onSortChange,
}: {
  view: DynamicView;
  sortKey?: string;
  sortDir?: SortDirection;
  onSortChange?: (key: string) => void;
}) {
  const [query, setQuery] = useState("");

  const columns = view.columns ?? [];
  const rows = view.data?.rows ?? [];

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      Object.values(row.values).some((value) =>
        String(value ?? "").toLowerCase().includes(q)
      )
    );
  }, [query, rows]);

  return (
    <div className="flex flex-col gap-[18px]">
      <section className="flex items-end justify-between gap-6">
        <div>
          <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--ik-ink-3)]">
            Dashboard / Watchlist
          </div>
          <h1 className="font-sans text-[34px] font-bold tracking-[-0.025em] text-[var(--ik-ink)]">
            {view.title}
          </h1>
          {view.description ? (
            <p className="mt-1.5 max-w-[540px] font-sans text-[13.5px] leading-6 text-[var(--ik-ink-3)]">
              {view.description}
            </p>
          ) : null}
        </div>

        
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Kpi label="Tracked" value={rows.length} detail="Stocks in this view" />
        <Kpi label="Source" value={view.meta?.source?.name ?? "Internal"} detail={view.meta?.freshness ?? "fresh"} />
        <Kpi label="Quality" value={view.meta?.data_quality ?? "—"} detail="Backend metadata" />
        <Kpi label="Columns" value={columns.length} detail="Server controlled" />
      </section>

      {view.features?.searchable ? (
          <div className="flex min-w-[360px] items-center gap-2.5 rounded-[14px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.60))] py-1.5 pl-4 pr-1.5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_20px_-8px_rgba(43,69,112,0.18)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
            <MagnifyingGlassIcon size={16} className="text-[var(--ik-ink-3)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stocks, symbol, sector..."
              className="min-w-0 flex-1 bg-transparent py-2 font-sans text-sm text-[var(--ik-ink)] outline-none placeholder:text-[var(--ik-ink-4)]"
            />
            <button className="rounded-[10px] bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] px-3.5 py-2 font-sans text-[13px] font-semibold text-white shadow-[0_4px_12px_-2px_rgba(43,107,255,0.45)] dark:text-black">
              Add Stock
            </button>
          </div>
        ) : null}

      <section className="overflow-hidden rounded-[18px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.55))] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_24px_-10px_rgba(43,69,112,0.16)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(22,22,25,0.82),rgba(15,15,18,0.74))]">
        <div className="flex items-center justify-between border-b border-[var(--ik-rule)] px-[18px] py-3.5">
          <div className="flex items-center gap-2 font-sans text-sm font-semibold text-[var(--ik-ink)]">
            <StarIcon size={16} className="text-[var(--ik-accent-deep)]" />
            {view.title} Table
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--ik-ink-3)]">
            {filteredRows.length} rows · server-driven
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="grid min-h-[280px] place-items-center px-6 py-12 text-center">
            <div>
              <h3 className="font-sans text-base font-semibold text-[var(--ik-ink)]">
                {view.empty_state?.title ?? "No data available"}
              </h3>
              <p className="mt-1 text-sm text-[var(--ik-ink-3)]">
                {view.empty_state?.description ?? "Try changing your search or add a stock."}
              </p>
            </div>
          </div>
        ) : (
          <Table className="text-[12px]">
            <TableHeader>
              <TableRow className="border-[var(--ik-rule)] hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "h-10 whitespace-nowrap bg-white/30 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ik-ink-3)] dark:bg-white/[0.03]",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center"
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.min_width,
                    }}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-[var(--ik-rule)] transition hover:bg-white/40 dark:hover:bg-white/[0.04]"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        "h-[54px] whitespace-nowrap py-2.5",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center"
                      )}
                    >
                      <RenderCell column={column} row={row} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.55))] px-4 py-3.5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_4px_16px_-8px_rgba(43,69,112,0.12)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(22,22,25,0.82),rgba(15,15,18,0.74))]">
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-bold leading-none text-[var(--ik-ink)]">
        {value}
      </div>
      <div className="mt-1.5 font-sans text-[11.5px] text-[var(--ik-ink-2)]">
        {detail}
      </div>
    </div>
  );
}