import { InvestKodeShell } from "@/components/app-shell/investkode-shell";
import { WatchlistPageClient } from "@/components/watchlist/watchlist-page-client";

export default function WatchlistPage() {
  return (
    <InvestKodeShell>
      <div className="flex-1 overflow-auto px-6 py-[22px]">
        <WatchlistPageClient />
      </div>
    </InvestKodeShell>
  );
}