"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import type { SortDirection } from "@/components/dynamic-view/types";
import { DynamicViewRenderer } from "@/components/dynamic-view/dynamic-view-renderer";
import { ViewPagination } from "@/components/dynamic-view/pagination/view-pagination";
import {
  CLIENT_TABLE_ROW_LIMIT,
  processRows,
} from "@/components/dynamic-view/utils/process-rows";
import { useWatchlistView } from "@/features/watchlist/hooks";

import { WatchlistSkeleton } from "./watchlist-skeleton";

export function WatchlistPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTabId, setActiveTabId] = useState("all");
  const [tableMode, setTableMode] = useState<"client" | "server">("client");

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string | undefined>>(
    {}
  );
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortKey, setSortKey] = useState("position");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const isAllView = activeTabId === "all";

  const viewQuery = useWatchlistView({
    viewId: "watchlist.default",
    // In client mode, we fetch ALL stocks and filter locally to avoid API calls on tab switch
    watchlistId: tableMode === "server" && !isAllView ? activeTabId : undefined,
    mode: tableMode,

    /**
     * These are sent to backend only in server mode.
     * api.ts must not send them in client mode.
     */
    page: tableMode === "server" ? page : 1,
    pageSize: tableMode === "server" ? pageSize : undefined,
    sortKey: tableMode === "server" ? sortKey : undefined,
    sortDir: tableMode === "server" ? sortDir : undefined,
    search: tableMode === "server" ? searchQuery.trim() || undefined : undefined,
    filters: tableMode === "server" ? filters : {},
  });

  const rawResponse = viewQuery.data;
  const rawRows = rawResponse?.view.data?.rows ?? [];

  const backendTotalItems =
    rawResponse?.view.pagination?.total_items ?? rawRows.length;

  useEffect(() => {
    if (!rawResponse) return;

    const nextMode =
      backendTotalItems <= CLIENT_TABLE_ROW_LIMIT ? "client" : "server";

    setTableMode((prev) => (prev === nextMode ? prev : nextMode));
  }, [rawResponse, backendTotalItems]);

  const processedResponse = useMemo(() => {
    if (!rawResponse) return null;

    if (tableMode === "server") {
      return rawResponse;
    }

    // In client mode, we filter rows by the active tab if it's not "all"
    let rowsToProcess = rawRows;
    if (activeTabId !== "all") {
      rowsToProcess = rawRows.filter((row) => 
        row.meta?.list_ids?.includes(activeTabId) || 
        row.meta?.watchlist_id === activeTabId
      );
    }

    const processed = processRows({
      rows: rowsToProcess,
      search: searchQuery,
      filters,
      sortKey,
      sortDir,
      page,
      pageSize,
    });

    return {
      ...rawResponse,
      view: {
        ...rawResponse.view,
        data: {
          ...rawResponse.view.data,
          rows: processed.rows,
        },
        pagination: processed.pagination,
      },
    };
  }, [
    rawResponse,
    rawRows,
    tableMode,
    activeTabId, // Added activeTabId to dependencies
    searchQuery,
    filters,
    sortKey,
    sortDir,
    page,
    pageSize,
  ]);

  function handleSortChange(key: string) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }

    setPage(1);
  }

  function handleListChange(listId: string) {
    setActiveTabId(listId);
    setSearchQuery("");
    setFilters({});
    setPage(1);
    setSortKey("position");
    setSortDir("asc");
  }

  const isUnauthorized =
    viewQuery.error instanceof Error &&
    viewQuery.error.message === "Unauthorized";

  useEffect(() => {
    if (isUnauthorized) {
      queryClient.clear();
      router.replace("/auth");
    }
  }, [isUnauthorized, router, queryClient]);

  if (viewQuery.isLoading) {
    return <WatchlistSkeleton />;
  }

  if (viewQuery.error || !processedResponse?.success) {
    if (isUnauthorized) {
      return null;
    }

    return (
      <div className="rounded-[18px] border border-[var(--ik-rule)] bg-white/60 p-6 text-[var(--ik-ink)] dark:bg-white/5">
        <div className="font-sans text-base font-semibold">
          Failed to load watchlist
        </div>

        <p className="mt-1 text-sm text-[var(--ik-ink-3)]">
          {viewQuery.error instanceof Error
            ? viewQuery.error.message
            : "The server-driven watchlist view could not be loaded."}
        </p>

        <button
          type="button"
          onClick={() => viewQuery.refetch()}
          className="mt-4 rounded-lg border border-[var(--ik-rule)] px-3 py-2 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const pagination = processedResponse.view.pagination;

  return (
    <div className="space-y-4">
      <DynamicViewRenderer
        response={processedResponse}
        activeListId={activeTabId}
        onListChange={handleListChange}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        filters={filters}
        onFiltersChange={(nextFilters) => {
          setFilters(nextFilters);
          setPage(1);
        }}
        trackedFincodes={
          new Set(
            rawRows
              .filter(
                (r) =>
                  activeTabId === "all" ||
                  r.meta?.list_ids?.includes(activeTabId) ||
                  r.meta?.watchlist_id === activeTabId
              )
              .flatMap((r) => {
                const arr = [String(r.id)];
                if (r.meta?.fincode) arr.push(String(r.meta.fincode));
                if (r.values?.symbol) arr.push(String(r.values.symbol));
                const stockVal = r.values?.stock as any;
                if (stockVal?.symbol) arr.push(String(stockVal.symbol));
                return arr;
              })
          )
        }
      />

      {pagination && pagination.total_pages > 1 ? (
        <ViewPagination
          page={pagination.page}
          totalPages={pagination.total_pages}
          onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() =>
            setPage((prev) => Math.min(pagination.total_pages, prev + 1))
          }
        />
      ) : null}
    </div>
  );
}