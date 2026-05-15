"use client";

import { BellIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

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
          Watchlist
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="rounded-full border border-[var(--ik-rule)] bg-white/60 px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--ik-ink-2)] backdrop-blur dark:bg-white/5">
          <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-[var(--ik-good)]" />
          MARKET OPEN · NSE
        </span>

        <span className="rounded-full border border-[var(--ik-rule)] bg-white/60 px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--ik-ink-2)] backdrop-blur dark:bg-white/5">
          SENSEX{" "}
          <b className="font-semibold text-[var(--ik-good)]">+0.42%</b>
        </span>

        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="grid size-[30px] place-items-center rounded-lg text-[var(--ik-ink-2)] transition hover:bg-white/70 hover:text-[var(--ik-accent-deep)] dark:hover:bg-white/10 dark:hover:text-white"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {!mounted ? (
            <div className="size-4 animate-pulse rounded-full bg-[var(--ik-rule)]" />
          ) : isDark ? (
            <SunIcon size={16} />
          ) : (
            <MoonIcon size={16} />
          )}
        </button>

        <button
          type="button"
          className="grid size-[30px] place-items-center rounded-lg text-[var(--ik-ink-2)] transition hover:bg-white/70 hover:text-[var(--ik-accent-deep)] dark:hover:bg-white/10 dark:hover:text-white"
          title="Notifications"
          aria-label="Notifications"
        >
          <BellIcon size={16} />
        </button>
      </div>
    </header>
  );
}