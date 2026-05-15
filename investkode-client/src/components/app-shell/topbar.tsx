export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--ik-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.25))] px-[18px] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(22,22,25,0.70),rgba(15,15,18,0.40))]">
      <div className="flex items-center gap-3">
        <div className="grid size-7 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,107,255,0.35)] dark:text-black">
          i
        </div>

        <div className="font-sans text-base font-bold tracking-[-0.02em] text-[var(--ik-ink)]">
          InvestKaro
        </div>

        <div className="border-l border-[var(--ik-rule)] pl-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ik-ink-3)]">
          India · Equity
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="rounded-full border border-[var(--ik-rule)] bg-white/60 px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--ik-ink-2)] backdrop-blur dark:bg-white/5">
          <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-[var(--ik-good)]" />
          MARKET OPEN
        </div>
      </div>
    </header>
  );
}