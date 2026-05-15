import type { DynamicColumn, DynamicRow, WatchlistTab } from "../types";
import { formatValue } from "./formatter-registry";
import { toneClass } from "./tone-registry";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "../cells/company-logo";
import { WatchlistRowActions } from "@/components/watchlist/watchlist-row-actions";

type CellProps = {
  column: DynamicColumn;
  row: DynamicRow;
  lists?: WatchlistTab[];
};

function getValue(row: DynamicRow, key: string) {
  return row.values[key];
}

export function RenderCell({ column, row, lists = [] }: CellProps) {
  const value = getValue(row, column.key);

  switch (column.renderer) {
    case "company": {
      const company = row.values.company_name ?? row.values.name ?? value;
      const symbol = row.values.symbol ?? row.values.ticker;
      const exchange = row.values.exchange ?? "NSE";

      return (
        <div className="flex min-w-[220px] items-center gap-3">
          <CompanyLogo row={row} />

          <div className="min-w-0">
            <div className="truncate font-sans text-[14px] font-bold text-[var(--ik-ink)]">
              {String(company ?? "—")}
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] font-medium tracking-wide text-[var(--ik-ink-3)]">
              {String(symbol ?? "—")} <span className="mx-1 text-[var(--ik-rule)]">·</span> {String(exchange)}
            </div>
          </div>
        </div>
      );
    }

    case "change_badge": {
      const n = Number(value);
      const tone = n >= 0 ? "positive" : "negative";

      return (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-1 font-mono text-[11px] font-semibold",
            toneClass(tone)
          )}
        >
          {formatValue(value, column.formatter ?? "percentage")}
        </span>
      );
    }

    case "price_range_band": {
      const low = Number(row.values.low_52w ?? row.values.low);
      const high = Number(row.values.high_52w ?? row.values.high);
      const price = Number(row.values.last_price ?? row.values.price);

      const pct =
        Number.isFinite(low) && Number.isFinite(high) && high > low
          ? Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100))
          : 0;

      return (
        <div className="min-w-[150px]">
          <div className="relative h-1.5 rounded-full bg-[var(--ik-rule)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--ik-accent),var(--ik-good))]"
              style={{ width: `${pct}%` }}
            />
            {/* Knob/Handle */}
            <div
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-md border-[2.5px] border-white bg-[#5B72A0] shadow-[0_2px_4px_rgba(0,0,0,0.2)] dark:border-[#1A1A1D]"
              style={{ left: `${pct}%` }}
            />
          </div>
          <div className="mt-2.5 flex justify-between font-mono text-[9px] font-semibold tracking-wider text-[var(--ik-ink-3)]">
            <span className="opacity-70">₹{Number.isFinite(low) ? low.toLocaleString() : "—"}</span>
            <span className="text-[var(--ik-accent-deep)] dark:text-white">{pct.toFixed(0)}%</span>
            <span className="opacity-70">₹{Number.isFinite(high) ? high.toLocaleString() : "—"}</span>
          </div>
        </div>
      );
    }

    case "badge":
      return (
        <span className="inline-flex rounded-full border border-[var(--ik-rule)] bg-white/50 px-2 py-1 font-mono text-[10.5px] font-medium text-[var(--ik-ink-2)] dark:bg-white/5">
          {formatValue(value, column.formatter)}
        </span>
      );

    case "number":
      return (
        <span className="font-mono text-[12.5px] font-semibold text-[var(--ik-ink)]">
          {formatValue(value, column.formatter)}
        </span>
      );

    case "actions":
      return <WatchlistRowActions row={row} lists={lists} />;

    case "text":
    default:
      return (
        <span className="text-[12.5px] text-[var(--ik-ink-2)]">
          {formatValue(value, column.formatter)}
        </span>
      );
  }
}