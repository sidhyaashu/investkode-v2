import type {
  DynamicViewResponse,
  SortDirection,
} from "@/components/dynamic-view/types";
import { WatchlistViewRenderer } from "@/components/watchlist/watchlist-view-renderer";
import { DataGridRenderer } from "./renderers/data-grid-renderer";

export function DynamicViewRenderer({
  response,
  activeListId,
  onListChange,
  searchQuery,
  onSearchChange,
  sortKey,
  sortDir,
  onSortChange,
  filters,
  onFiltersChange,
  trackedFincodes,
}: {
  response: DynamicViewResponse;
  activeListId?: string;
  onListChange?: (listId: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  sortKey?: string;
  sortDir?: SortDirection;
  onSortChange?: (key: string) => void;
  filters?: Record<string, string | undefined>;
  onFiltersChange?: (filters: Record<string, string | undefined>) => void;
  trackedFincodes?: Set<string>;
}) {
  if (!response.success || response.status === "error") {
    return (
      <div className="rounded-[18px] border border-[var(--ik-rule)] bg-white/60 p-6 text-[var(--ik-ink)] dark:bg-white/5">
        Failed to load view.
      </div>
    );
  }

  if (response.status === "permission_denied") {
    return (
      <div className="rounded-[18px] border border-[var(--ik-rule)] bg-white/60 p-6 text-[var(--ik-ink)] dark:bg-white/5">
        You do not have permission to view this data.
      </div>
    );
  }

  if (response.view.view_id === "watchlist.default") {
    return (
      <WatchlistViewRenderer
        view={response.view}
        activeListId={activeListId}
        onListChange={onListChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={onSortChange}
        filters={filters}
        onFiltersChange={onFiltersChange}
        trackedFincodes={trackedFincodes}
      />
    );
  }

  if (response.view.view_type === "data_grid") {
    return (
      <DataGridRenderer
        view={response.view}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={onSortChange}
      />
    );
  }

  return (
    <div className="rounded-[18px] border border-[var(--ik-rule)] bg-white/60 p-6 text-[var(--ik-ink)] dark:bg-white/5">
      Unsupported view type: {response.view.view_type}
    </div>
  );
}