import { apiClient } from "@/lib/api-client";
import type {
  DynamicViewResponse,
  SortDirection,
} from "@/components/dynamic-view/types";

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: unknown;
};

export type Watchlist = {
  id: string;
  name: string;
  description?: string | null;
  type?: string;
  source?: "default" | "user";
  is_default?: boolean;
  sort_order?: number;
  items_count?: number;
};

export type InstrumentSearchItem = {
  id: string;
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string | null;
  last_price?: number | null;
  change?: number | null;
};

export type CreateWatchlistPayload = {
  name: string;
  type?: string;
  description?: string | null;
};

export type AddWatchlistItemPayload = {
  watchlistId: string;
  instrument_id?: string | null;
  symbol: string;
  exchange?: string;
};

export async function fetchWatchlists() {
  const res = await apiClient<ApiEnvelope<Watchlist[]>>("/api/v1/watchlists");
  return res.data;
}

export async function createWatchlist(payload: CreateWatchlistPayload) {
  const res = await apiClient<ApiEnvelope<Watchlist>>("/api/v1/watchlists", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.data;
}

export async function addWatchlistItem(payload: AddWatchlistItemPayload) {
  const { watchlistId, ...body } = payload;

  const res = await apiClient<ApiEnvelope<unknown>>(
    `/api/v1/watchlists/${watchlistId}/items/`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return res.data;
}

export async function searchInstruments(query: string) {
  if (query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query.trim(),
  });

  const res = await apiClient<ApiEnvelope<InstrumentSearchItem[]>>(
    `/api/v1/watchlists/instruments/search?${params.toString()}`
  );

  return res.data;
}

export async function fetchPopularInstruments() {
  const res = await apiClient<ApiEnvelope<InstrumentSearchItem[]>>(
    "/api/v1/watchlists/instruments/popular"
  );

  return res.data;
}

export async function fetchWatchlistView(params: {
  viewId: string;
  watchlistId?: string;
  mode: "client" | "server";

  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: SortDirection;
  search?: string;
  filters?: Record<string, string | undefined>;
}) {
  const searchParams = new URLSearchParams();

  searchParams.set("view_id", params.viewId);
  searchParams.set("mode", params.mode);

  if (params.watchlistId) {
    searchParams.set("watchlist_id", params.watchlistId);
  }

  /**
   * Only send table operation params in server mode.
   * For client mode, fetch full rows once.
   */
  if (params.mode === "server") {
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
    if (params.sortKey) searchParams.set("sort_key", params.sortKey);
    if (params.sortDir) searchParams.set("sort_dir", params.sortDir);
    if (params.search) searchParams.set("search", params.search);

    Object.entries(params.filters ?? {}).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }

  return apiClient<DynamicViewResponse>(
    `/api/v1/watchlists/view?${searchParams.toString()}`
  );
}