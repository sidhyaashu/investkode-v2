import type { DynamicColumn, DynamicRow } from "../types";
import { formatValue } from "./formatter-registry";
import { toneClass } from "./tone-registry";
import { cn } from "@/lib/utils";

type CellProps = {
  column: DynamicColumn;
  row: DynamicRow;
};

function getValue(row: DynamicRow, key: string) {
  return row.values[key];
}

export function RenderCell({ column, row }: CellProps) {
  const value = getValue(row, column.key);

  switch (column.renderer) {
    case "company": {
      const company = row.values.company_name ?? row.values.name ?? value;
      const symbol = row.values.symbol ?? row.values.ticker;
      const exchange = row.values.exchange ?? "NSE";
      const initials = String(symbol || company || "IK").slice(0, 2).toUpperCase();

      return (
        <div className="flex min-w-[220px] items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] font-mono text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(43,107,255,0.25)] dark:text-black">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate font-sans text-[13px] font-semibold text-[var(--ik-ink)]">
              {String(company ?? "—")}
            </div>
            <div className="font-mono text-[10.5px] text-[var(--ik-ink-3)]">
              {String(symbol ?? "—")} · {String(exchange)}
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
          <div className="h-1.5 rounded-full bg-[var(--ik-rule)]">
            <div
              className="relative h-1.5 rounded-full bg-[linear-gradient(90deg,var(--ik-accent),var(--ik-good))]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--ik-ink-3)]">
            <span>₹{Number.isFinite(low) ? low.toFixed(0) : "—"}</span>
            <span>{pct.toFixed(0)}%</span>
            <span>₹{Number.isFinite(high) ? high.toFixed(0) : "—"}</span>
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
      return (
        <button className="rounded-lg border border-[var(--ik-rule)] bg-white/50 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ik-ink-2)] hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10">
          Open
        </button>
      );

    case "text":
    default:
      return (
        <span className="text-[12.5px] text-[var(--ik-ink-2)]">
          {formatValue(value, column.formatter)}
        </span>
      );
  }
}