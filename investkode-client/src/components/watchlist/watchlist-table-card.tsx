"use client";

import {
  ArrowClockwise,
  DownloadSimple,
  DotsSixVertical,
  Plus,
  Star,
} from "@phosphor-icons/react";
import type {
  DynamicColumn,
  DynamicRow,
  WatchlistTab,
} from "@/components/dynamic-view/types";
import { RenderCell } from "@/components/dynamic-view/registry/cell-renderer-registry";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function WatchlistTableCard({
  title,
  rows,
  columns,
  lists = [],
  allowExport,
  allowAddStock,
  allowDragReorder,
  onAddStock,
  onReset,
  onRowsReorder,
  sortKey,
  sortDir,
  onSort,
}: {
  title: string;
  rows: DynamicRow[];
  columns: DynamicColumn[];
  lists?: WatchlistTab[];
  allowExport?: boolean;
  allowAddStock?: boolean;
  allowDragReorder?: boolean;
  onAddStock: () => void;
  onReset?: () => void;
  onRowsReorder?: (rows: DynamicRow[]) => void;
  sortKey?: string | null;
  sortDir?: "asc" | "desc" | null;
  onSort?: (key: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ id: string; position: "top" | "bottom" } | null>(null);

  function reorder(dropId: string, position: "top" | "bottom") {
    if (!dragId || dragId === dropId) return;

    const fromIndex = rows.findIndex((row) => row.id === dragId);
    const toIndex = rows.findIndex((row) => row.id === dropId);

    if (fromIndex < 0 || toIndex < 0) return;

    const nextRows = [...rows];
    const [moved] = nextRows.splice(fromIndex, 1);

    const adjustedToIndex = nextRows.findIndex((row) => row.id === dropId);
    nextRows.splice(position === "bottom" ? adjustedToIndex + 1 : adjustedToIndex, 0, moved);

    onRowsReorder?.(nextRows);
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.55))] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_24px_-10px_rgba(43,69,112,0.16)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.82),rgba(18,18,21,0.62))] dark:shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_8px_24px_-10px_rgba(0,0,0,0.6)]">
      <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-[var(--ik-rule)] px-[18px] py-3.5">
        <div className="flex items-center gap-2.5 font-sans text-sm font-semibold text-[var(--ik-ink)]">
          <Star size={16} className="text-[var(--ik-accent-deep)]" />
          <span>{title}</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--ik-ink-3)]">
            {rows.length} {rows.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <ToolButton onClick={onReset}>
            <ArrowClockwise size={12} />
            Reset
          </ToolButton>

          <ToolButton disabled={!allowExport}>
            <DownloadSimple size={12} />
            Export
          </ToolButton>

          {allowAddStock ? (
            <button
              type="button"
              onClick={onAddStock}
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] px-2.5 py-1.5 font-sans text-xs font-medium text-white shadow-[0_3px_10px_-2px_rgba(43,107,255,0.35)] transition hover:translate-y-[-1px] dark:text-black"
            >
              <Plus size={12} weight="bold" />
              Add stock
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--ik-rule)] hover:bg-transparent">
              {allowDragReorder ? (
                <TableHead className="w-8 bg-white/40 dark:bg-[rgba(18,18,21,0.55)]" />
              ) : null}

              {columns.map((column) => {
                const isActive = sortKey === column.key;
                const canSort = column.sortable !== false;

                return (
                  <TableHead
                    key={column.key}
                    onClick={() => canSort && onSort?.(column.key)}
                    className={cn(
                      "sticky top-0 h-10 whitespace-nowrap border-b border-[var(--ik-rule)] bg-white/40 px-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--ik-ink-3)] dark:bg-[rgba(18,18,21,0.55)]",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      canSort && "cursor-pointer select-none hover:text-[var(--ik-ink-2)]"
                    )}
                    style={{ width: column.width, minWidth: column.min_width }}
                  >
                    <div className={cn(
                      "flex items-center gap-1",
                      column.align === "right" && "justify-end",
                      column.align === "center" && "justify-center"
                    )}>
                      {column.label}
                      {canSort ? (
                        <span className={cn(
                          "text-[9px] transition-opacity",
                          isActive ? "opacity-100 text-[var(--ik-accent-deep)]" : "opacity-30"
                        )}>
                          {isActive ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      ) : null}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length ? (
              rows.map((row) => {
                const isDragging = dragId === row.id;
                const overTop = dragOver?.id === row.id && dragOver.position === "top";
                const overBottom = dragOver?.id === row.id && dragOver.position === "bottom";

                const canDragRow = allowDragReorder && row.meta?.draggable !== false;

                return (
                  <TableRow
                    key={row.id}
                    draggable={canDragRow}
                    onDragStart={(event) => {
                      if (!canDragRow) return;
                      setDragId(row.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDragOver(null);
                    }}
                    onDragOver={(event) => {
                      if (!canDragRow) return;

                      event.preventDefault();

                      const rect = event.currentTarget.getBoundingClientRect();
                      const after = event.clientY - rect.top > rect.height / 2;

                      setDragOver({
                        id: row.id,
                        position: after ? "bottom" : "top",
                      });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();

                      if (!dragOver || !canDragRow) return;

                      reorder(row.id, dragOver.position);
                      setDragId(null);
                      setDragOver(null);
                    }}
                    className={cn(
                      "border-[var(--ik-rule-2)] transition hover:bg-white/55 dark:hover:bg-white/[0.03]",
                      isDragging && "opacity-40 bg-[rgba(43,107,255,0.06)]",
                      overTop && "shadow-[inset_0_2px_0_var(--ik-accent)] dark:shadow-[inset_0_2px_0_#F2F2F3]",
                      overBottom && "shadow-[inset_0_-2px_0_var(--ik-accent)] dark:shadow-[inset_0_-2px_0_#F2F2F3]"
                    )}
                  >
                    {allowDragReorder ? (
                      <TableCell className="w-8 px-2 text-center text-[var(--ik-ink-4)]">
                        {canDragRow ? (
                          <DotsSixVertical
                            size={16}
                            className="cursor-grab opacity-60 transition hover:text-[var(--ik-accent-deep)] hover:opacity-100 active:cursor-grabbing"
                          />
                        ) : null}
                      </TableCell>
                    ) : null}

                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "px-3.5 py-3.5 align-middle font-sans text-[13px] text-[var(--ik-ink-2)]",
                          column.align === "right" && "text-right",
                          column.align === "center" && "text-center"
                        )}
                      >
                        <RenderCell column={column} row={row} lists={lists} />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>
                  <div className="px-5 py-[60px] text-center text-[var(--ik-ink-3)]">
                    <Star size={48} className="mx-auto mb-3 text-[var(--ik-ink-4)]" />
                    <h3 className="mb-1 font-sans text-base font-semibold text-[var(--ik-ink-2)]">
                      This list is empty
                    </h3>
                    <p className="mx-auto max-w-[340px] font-sans text-[13px] leading-6">
                      Add stocks to this list from the search above, or browse the modal.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function ToolButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ik-rule)] bg-white/65 px-2.5 py-1.5 font-sans text-xs font-medium text-[var(--ik-ink-2)] transition hover:border-[var(--ik-accent-2)] hover:bg-white/85 hover:text-[var(--ik-accent-deep)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
    >
      {children}
    </button>
  );
}