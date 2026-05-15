import type { WatchlistType } from "@/components/dynamic-view/types";

export const watchlistTypeStyle: Record<
  WatchlistType,
  {
    dotClass: string;
    label: string;
  }
> = {
  all: {
    dotClass: "bg-[var(--ik-accent)]",
    label: "All",
  },
  core: {
    dotClass: "bg-[var(--ik-accent)]",
    label: "Core holdings",
  },
  it: {
    dotClass: "bg-[var(--ik-good)]",
    label: "IT services",
  },
  banks: {
    dotClass: "bg-[var(--ik-warn)]",
    label: "Banks & NBFC",
  },
  speculative: {
    dotClass: "bg-[var(--ik-danger)]",
    label: "Speculative",
  },
  growth: {
    dotClass: "bg-[var(--ik-accent-deep)]",
    label: "Growth",
  },
  custom: {
    dotClass: "bg-[var(--ik-ink-3)]",
    label: "Custom",
  },
};
