import type { DynamicViewResponse } from "./types";
import { WatchlistViewRenderer } from "@/components/watchlist/watchlist-view-renderer";
import { DataGridRenderer } from "./renderers/data-grid-renderer";

export function DynamicViewRenderer({
  response,
}: {
  response: DynamicViewResponse;
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
    return <WatchlistViewRenderer view={response.view} />;
  }

  switch (response.view.view_type) {
    case "data_grid":
      return <DataGridRenderer view={response.view} />;

    default:
      return (
        <div className="rounded-[18px] border border-[var(--ik-rule)] bg-white/60 p-6 text-[var(--ik-ink)] dark:bg-white/5">
          Unsupported view type: {response.view.view_type}
        </div>
      );
  }
}