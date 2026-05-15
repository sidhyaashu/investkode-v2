import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type ViewPaginationProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function ViewPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: ViewPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-[14px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.45))] px-3.5 py-3 shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] dark:bg-[linear-gradient(180deg,rgba(28,28,32,0.74),rgba(20,20,23,0.54))]">
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrevious}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ik-rule)] bg-white/65 px-3 py-2 font-sans text-xs font-medium text-[var(--ik-ink-2)] transition hover:border-[var(--ik-accent-2)] hover:bg-white/85 hover:text-[var(--ik-accent-deep)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
      >
        <CaretLeft size={14} />
        Previous
      </button>

      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ik-ink-3)]">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ik-rule)] bg-white/65 px-3 py-2 font-sans text-xs font-medium text-[var(--ik-ink-2)] transition hover:border-[var(--ik-accent-2)] hover:bg-white/85 hover:text-[var(--ik-accent-deep)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
      >
        Next
        <CaretRight size={14} />
      </button>
    </div>
  );
}
