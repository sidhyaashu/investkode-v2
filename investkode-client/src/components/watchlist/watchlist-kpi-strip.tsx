import type { WatchlistKpiCard } from "@/components/dynamic-view/types";
import { cn } from "@/lib/utils";

export function WatchlistKpiStrip({ cards }: { cards: WatchlistKpiCard[] }) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.key}
          className="relative overflow-hidden rounded-[14px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.55))] px-4 py-3.5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_4px_16px_-8px_rgba(43,69,112,0.12)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(28,28,32,0.82),rgba(20,20,23,0.66))] dark:shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_4px_16px_-8px_rgba(0,0,0,0.6)]"
        >
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
            {card.label}
          </div>

          <div
            className={cn(
              "mt-1 font-mono text-2xl font-bold leading-none tracking-[-0.01em] text-[var(--ik-ink)]",
              card.tone === "positive" && "text-[var(--ik-good)]",
              card.tone === "negative" && "text-[var(--ik-danger-deep)]"
            )}
          >
            {card.value}
            {card.suffix ? (
              <small className="ml-1 text-xs font-medium text-[var(--ik-ink-3)]">
                {card.suffix}
              </small>
            ) : null}
          </div>

          {card.sub_value ? (
            <div
              className={cn(
                "mt-1.5 font-sans text-[11.5px] text-[var(--ik-ink-2)]",
                card.sub_tone === "positive" && "text-[var(--ik-good)]",
                card.sub_tone === "negative" && "text-[var(--ik-danger-deep)]"
              )}
            >
              {card.sub_value}
            </div>
          ) : null}

          {card.helper ? (
            <div className="mt-1.5 font-sans text-[11.5px] text-[var(--ik-ink-2)]">
              {card.helper}
            </div>
          ) : null}

          {card.sparkline?.length ? <Sparkline values={card.sparkline} tone={card.tone} /> : null}
        </article>
      ))}
    </section>
  );
}

function Sparkline({
  values,
  tone,
}: {
  values: number[];
  tone?: WatchlistKpiCard["tone"];
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 64;
      const y = 22 - ((value - min) / range) * 18;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className={cn(
        "absolute right-2.5 top-3.5 h-6 w-16 opacity-85",
        tone === "positive" ? "text-[var(--ik-good)]" : "text-[var(--ik-accent-deep)] dark:text-[var(--ik-ink-2)]"
      )}
      viewBox="0 0 64 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <polyline points={points} />
    </svg>
  );
}