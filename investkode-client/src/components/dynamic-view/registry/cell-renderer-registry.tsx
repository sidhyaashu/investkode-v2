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
          {formatValue(value, column.formatter ?? "percentage", row)}
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
        <div className="inline-block w-[120px]">
          <div
            className="relative h-1.5 rounded-full border border-[var(--ik-rule-2)]"
            style={{
              background:
                "linear-gradient(90deg, rgba(226,85,122,.18), rgba(226,154,43,.18) 50%, rgba(16,163,127,.18))",
            }}
          >
            <div
              className="absolute -top-[3px] h-3 w-[3px] -translate-x-1/2 rounded-[2px] bg-[var(--ik-ink)] shadow-[0_0_0_2px_rgba(255,255,255,0.9),0_0_0_3px_rgba(11,37,69,0.15)] dark:bg-white dark:shadow-[0_0_0_2px_rgba(0,0,0,0.9),0_0_0_3px_rgba(255,255,255,0.15)]"
              style={{ left: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9.5px] tracking-[-0.005em] text-[var(--ik-ink-3)]">
            <span>₹{Number.isFinite(low) ? low.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}</span>
            <span className="font-semibold text-[var(--ik-accent-deep)] dark:text-white">{pct.toFixed(0)}%</span>
            <span>₹{Number.isFinite(high) ? high.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}</span>
          </div>
        </div>
      );
    }

    case "badge":
      return (
        <span className="inline-flex rounded-full border border-[var(--ik-rule)] bg-white/50 px-2 py-1 font-mono text-[10.5px] font-medium text-[var(--ik-ink-2)] dark:bg-white/5">
          {formatValue(value, column.formatter, row)}
        </span>
      );

    case "number":
      return (
        <span className="font-mono text-[12.5px] font-semibold text-[var(--ik-ink)]">
          {formatValue(value, column.formatter, row)}
        </span>
      );

    case "actions":
      return <WatchlistRowActions row={row} lists={lists} />;

    case "text":
    default:
      return (
        <span className="text-[12.5px] text-[var(--ik-ink-2)]">
          {formatValue(value, column.formatter, row)}
        </span>
      );
  }
}