export function WatchlistSkeleton() {
  return (
    <div className="flex flex-col gap-[18px] animate-pulse">
      <section className="flex items-end justify-between gap-6">
        <div>
          <div className="mb-1.5 h-3 w-32 rounded bg-[var(--ik-rule)]" />
          <div className="h-9 w-48 rounded bg-[var(--ik-rule)]" />
          <div className="mt-1.5 h-4 w-64 rounded bg-[var(--ik-rule)]" />
        </div>
      </section>

      {/* KPIs Skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-[var(--ik-rule)] bg-[var(--ik-field-bg)] p-5"
          />
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-12 w-full rounded-[14px] border border-[var(--ik-glass-border)] bg-[var(--ik-field-bg)]" />

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-24 rounded-[10px] border border-[var(--ik-rule)] bg-[var(--ik-field-bg)]"
          />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-[18px] border border-[var(--ik-rule)] bg-[var(--ik-field-bg)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--ik-rule)] p-4">
          <div className="h-5 w-24 rounded bg-[var(--ik-rule)]" />
          <div className="h-8 w-24 rounded bg-[var(--ik-rule)]" />
        </div>
        <div className="grid gap-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-[var(--ik-rule)] p-3 last:border-0"
            >
              <div className="h-4 w-6 rounded bg-[var(--ik-rule)]" />
              <div className="h-8 w-8 rounded-lg bg-[var(--ik-rule)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-[var(--ik-rule)]" />
                <div className="h-3 w-20 rounded bg-[var(--ik-rule)] opacity-70" />
              </div>
              <div className="h-4 w-16 rounded bg-[var(--ik-rule)]" />
              <div className="h-4 w-16 rounded bg-[var(--ik-rule)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
