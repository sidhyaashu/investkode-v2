import type { DynamicRow, SortDirection } from "@/components/dynamic-view/types";

export const CLIENT_TABLE_ROW_LIMIT = 100;

export function processRows({
  rows,
  search,
  filters,
  sortKey,
  sortDir,
  page,
  pageSize,
}: {
  rows: DynamicRow[];
  search: string;
  filters: Record<string, string | undefined>;
  sortKey: string;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
}) {
  let output = [...rows];

  const q = search.trim().toLowerCase();

  if (q) {
    output = output.filter((row) =>
      Object.values(row.values).some((value) =>
        String(value ?? "").toLowerCase().includes(q)
      )
    );
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;

    output = output.filter((row) => {
      return String(row.values[key] ?? "") === value;
    });
  });

  if (sortKey && sortDir) {
    output.sort((a, b) => {
      const av = a.values[sortKey];
      const bv = b.values[sortKey];

      const an = Number(av);
      const bn = Number(bv);

      let result = 0;

      if (!Number.isNaN(an) && !Number.isNaN(bn)) {
        result = an - bn;
      } else {
        result = String(av ?? "").localeCompare(String(bv ?? ""));
      }

      return sortDir === "asc" ? result : -result;
    });
  }

  const totalItems = output.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const start = (page - 1) * pageSize;
  const pagedRows = output.slice(start, start + pageSize);

  return {
    rows: pagedRows,
    pagination: {
      mode: "client" as const,
      page,
      page_size: pageSize,
      total_items: totalItems,
      total_pages: totalPages,
    },
  };
}