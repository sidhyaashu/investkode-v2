import type { Formatter } from "../types";

export function formatValue(value: unknown, formatter?: Formatter) {
  if (value === null || value === undefined || value === "") return "—";

  if (formatter === "currency_inr") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }

  if (formatter === "percentage") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  }

  if (formatter === "market_cap") {
    return String(value);
  }

  if (formatter === "pe") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n.toFixed(1);
  }

  if (formatter === "number") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n.toLocaleString("en-IN");
  }

  return String(value);
}