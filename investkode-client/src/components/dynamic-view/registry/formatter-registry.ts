import type { Formatter } from "../types";

export function formatValue(value: unknown, formatter?: Formatter, row?: any) {
  if (value === null || value === undefined || value === "") return "—";

  // Check for unit in row values or meta (e.g. unit=10000000 for Crores)
  const unit = Number(row?.values?.unit ?? row?.meta?.unit ?? 1);

  if (formatter === "currency_inr") {
    const n = Number(value) * unit;
    if (Number.isNaN(n)) return String(value);
    return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }

  if (formatter === "market_cap" || formatter === "market_cap_inr") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    
    // Scale by unit to get absolute Rupees first
    const absoluteRupees = n * unit;
    
    // Convert to Crores
    const cr = absoluteRupees / 10000000;
    
    // If over 100,000 Cr, show as L Cr (Lakh Crores)
    if (cr >= 100000) {
      return `₹${(cr / 100000).toFixed(2)} L Cr`;
    }
    return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
  }

  if (formatter === "percent" || formatter === "percentage") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
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