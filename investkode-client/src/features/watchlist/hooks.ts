import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addWatchlistItem,
  createWatchlist,
  fetchPopularInstruments,
  fetchWatchlistView,
  fetchWatchlists,
  searchInstruments,
  type AddWatchlistItemPayload,
  type CreateWatchlistPayload,
} from "./api";
import type { SortDirection } from "@/components/dynamic-view/types";

export const watchlistKeys = {
  all: ["watchlists"] as const,
  lists: () => [...watchlistKeys.all, "lists"] as const,
  view: (params: unknown) => [...watchlistKeys.all, "view", params] as const,
  search: (query: string) => [...watchlistKeys.all, "search", query] as const,
  popular: () => [...watchlistKeys.all, "popular"] as const,
};

export function useWatchlists() {
  return useQuery({
    queryKey: watchlistKeys.lists(),
    queryFn: fetchWatchlists,
  });
}

export function useWatchlistView(params: {
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
  return useQuery({
    queryKey: watchlistKeys.view(params),
    queryFn: () => fetchWatchlistView(params),
  });
}

export function useInstrumentSearch(query: string) {
  return useQuery({
    queryKey: watchlistKeys.search(query),
    queryFn: () => searchInstruments(query),
    enabled: query.trim().length >= 2,
  });
}

export function usePopularInstruments() {
  return useQuery({
    queryKey: watchlistKeys.popular(),
    queryFn: fetchPopularInstruments,
  });
}

export function useCreateWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWatchlistPayload) => createWatchlist(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      toast.success("Watchlist created");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create watchlist"
      );
    },
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddWatchlistItemPayload) => addWatchlistItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      toast.success("Stock added to watchlist");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add stock");
    },
  });
}