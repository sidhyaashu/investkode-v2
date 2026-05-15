"use client";

import {
  MagnifyingGlass,
  Plus,
  X,
  Check,
  ListPlus,
  ArrowLeft,
  CheckCircle,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  WatchlistTab,
  WatchlistPreset,
  WatchlistType,
} from "@/components/dynamic-view/types";
import { watchlistTypeStyle } from "./watchlist-style-registry";

export type StockSearchItem = {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  color: [string, string];
};

interface WatchlistActionModalProps {
  mode: "add" | "create";
  onClose: () => void;
  initialWatchlistId?: string;
  lists: WatchlistTab[];
  presets: WatchlistPreset[];
  universe: StockSearchItem[];
  trackedTickers: string[];
  onFinish: (data: {
    mode: "add" | "create";
    name?: string;
    type?: WatchlistType;
    instruments: StockSearchItem[];
    targetWatchlistId?: string;
  }) => void;
}

export function WatchlistActionModal({
  mode,
  onClose,
  initialWatchlistId,
  lists,
  presets,
  universe,
  trackedTickers,
  onFinish,
}: WatchlistActionModalProps) {
  const [step, setStep] = useState(1);
  const [selectedPresetType, setSelectedPresetType] =
    useState<WatchlistType | null>(null);
  const [customListName, setCustomListName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<StockSearchItem[]>(
    []
  );
  const [targetWatchlistId, setTargetWatchlistId] = useState(
    initialWatchlistId || ""
  );

  const tracked = useMemo(() => new Set(trackedTickers), [trackedTickers]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return universe.slice(0, 6);

    return universe
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.ticker.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [searchQuery, universe]);

  const isLastStep = step === 2;

  const isNextDisabled =
    mode === "create" && step === 1
      ? !selectedPresetType && !customListName.trim()
      : mode === "create" && step === 2
      ? selectedInstruments.length === 0
      : mode === "add" && step === 1
      ? selectedInstruments.length === 0
      : mode === "add" && step === 2
      ? !targetWatchlistId
      : false;

  const handleFinish = async () => {
    try {
      if (mode === "create") {
        const name =
          customListName.trim() ||
          presets.find((preset) => preset.type === selectedPresetType)?.label ||
          "My Watchlist";

        const type = selectedPresetType ?? "custom";

        onFinish({
          mode: "create",
          name,
          type,
          instruments: selectedInstruments,
        });
        onClose();
        return;
      }

      if (mode === "add") {
        onFinish({
          mode: "add",
          targetWatchlistId,
          instruments: selectedInstruments,
        });
        onClose();
      }
    } catch (error) {
      console.error("Mutation failed", error);
    }
  };

  const toggleInstrument = (inst: StockSearchItem) => {
    setSelectedInstruments((prev) => {
      const exists = prev.find((i) => i.ticker === inst.ticker);
      if (exists) return prev.filter((i) => i.ticker !== inst.ticker);
      return [...prev, inst];
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(11,37,69,0.32)] px-[18px] pt-20 backdrop-blur-md dark:bg-black/65"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-[580px] flex-col overflow-hidden rounded-[18px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,#fff,#FAFCFF)] shadow-[0_24px_60px_-10px_rgba(43,69,112,0.4),0_1px_0_rgba(255,255,255,0.7)_inset] dark:bg-[linear-gradient(180deg,#1A1A1D,#131316)] dark:shadow-[0_24px_60px_-10px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.04)_inset]">
        <div className="flex items-center justify-between border-b border-[var(--ik-rule)] px-[18px] py-4">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="grid size-7 place-items-center rounded-lg text-[var(--ik-ink-3)] hover:bg-[var(--ik-rule-2)] dark:hover:bg-white/5"
              >
                <ArrowLeft size={16} weight="bold" />
              </button>
            )}
            <div className="flex items-center gap-2 font-sans text-[15px] font-semibold text-[var(--ik-ink)]">
              {mode === "add" ? (
                <>
                  <Plus size={16} className="text-[var(--ik-accent-deep)]" />
                  Add stock to watchlist
                </>
              ) : (
                <>
                  <ListPlus size={16} className="text-[var(--ik-accent-deep)]" />
                  Create new watchlist
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-lg text-[var(--ik-ink-3)] hover:bg-[var(--ik-rule-2)] hover:text-[var(--ik-ink)] dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* STEP 1: SELECT STOCKS (Add Mode) */}
        {mode === "add" && step === 1 && (
          <div className="flex flex-1 flex-col">
            <div className="border-b border-[var(--ik-rule-2)] px-[18px] py-3.5">
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--ik-rule)] bg-[rgba(91,114,160,0.07)] px-3.5 py-2.5 focus-within:border-[var(--ik-accent-2)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_var(--ik-accent-soft)] dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
                <MagnifyingGlass size={15} className="text-[var(--ik-ink-3)]" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search NSE / BSE — type a name or ticker"
                  className="flex-1 bg-transparent font-sans text-sm text-[var(--ik-ink)] outline-none placeholder:text-[var(--ik-ink-4)]"
                />
              </div>
            </div>

            <div className="max-h-[340px] flex-1 overflow-y-auto p-1.5">
              <div className="px-3 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
                {searchQuery ? "Matches" : "Suggested"}
              </div>
              {searchResults.map((stock) => {
                const isTracked = tracked.has(stock.ticker);
                const isSelected = selectedInstruments.find(
                  (i) => i.ticker === stock.ticker
                );

                return (
                  <button
                    key={stock.ticker}
                    type="button"
                    disabled={isTracked}
                    onClick={() => toggleInstrument(stock)}
                    className={cn(
                      "grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-left transition hover:bg-[var(--ik-accent-soft)] dark:hover:bg-white/[0.05]",
                      isTracked && "cursor-default opacity-80"
                    )}
                  >
                    <div
                      className="grid size-[30px] place-items-center rounded-lg text-[10.5px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${stock.color[0]}, ${stock.color[1]})`,
                      }}
                    >
                      {stock.ticker.slice(0, 2)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-sans text-[13px] font-semibold text-[var(--ik-ink)]">
                        {stock.name}
                      </div>
                      <div className="mt-px font-mono text-[11px] text-[var(--ik-ink-3)]">
                        {stock.ticker} · {stock.sector}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 px-2 text-right">
                      <div className="font-mono text-[13px] font-semibold text-[var(--ik-ink)]">
                        ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-bold",
                          stock.change >= 0
                            ? "bg-[var(--ik-good-soft)] text-[var(--ik-good)]"
                            : "bg-[var(--ik-danger-soft)] text-[var(--ik-danger)]"
                        )}
                      >
                        {stock.change >= 0 ? <CaretUp size={10} weight="bold" /> : <CaretDown size={10} weight="bold" />}
                        {Math.abs(stock.change).toFixed(2)}%
                      </div>
                    </div>

                    <div className="flex min-w-[80px] justify-end">
                      {isSelected ? (
                        <CheckCircle
                          size={22}
                          weight="fill"
                          className="text-[var(--ik-accent-deep)]"
                        />
                      ) : isTracked ? (
                        <div className="flex items-center gap-1.5 font-sans text-[13px] font-bold text-[var(--ik-good)]">
                          <Check size={14} weight="bold" />
                          Added
                        </div>
                      ) : (
                        <div className="grid size-9 place-items-center rounded-xl bg-[#EDF3FF] text-[var(--ik-accent-deep)] transition hover:bg-[var(--ik-accent-soft)]">
                          <Plus size={18} weight="bold" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: SELECT TARGET LIST (Add Mode) */}
        {mode === "add" && step === 2 && (
          <div className="flex flex-1 flex-col overflow-y-auto p-5">
            <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
              Assign selected stocks to list
            </div>
            <div className="grid gap-2">
              {lists
                .filter((list) => list.id !== "all")
                .map((list) => {
                  const selected = targetWatchlistId === list.id;
                  const style =
                    watchlistTypeStyle[list.type] ?? watchlistTypeStyle.custom;

                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => setTargetWatchlistId(list.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                        selected
                          ? "border-[var(--ik-accent)] bg-[var(--ik-accent-soft)]"
                          : "border-[var(--ik-rule)] bg-[var(--ik-field-bg)] hover:border-[var(--ik-accent-2)]"
                      )}
                    >
                      <span
                        className={cn("size-2.5 rounded-full", style.dotClass)}
                      />
                      <div className="flex-1">
                        <div className="text-[14px] font-semibold text-[var(--ik-ink)]">
                          {list.label}
                        </div>
                        <div className="text-[11px] text-[var(--ik-ink-3)]">
                          {list.source === "default"
                            ? "Default list"
                            : "Custom list"}{" "}
                          · {list.count} stocks
                        </div>
                      </div>
                      {selected && (
                        <Check
                          size={16}
                          weight="bold"
                          className="text-[var(--ik-accent-deep)]"
                        />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* STEP 1: CHOOSE PRESET OR NAME (Create Mode) */}
        {mode === "create" && step === 1 && (
          <div className="flex flex-1 flex-col overflow-y-auto p-5">
            <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
              Select default list type
            </div>
            <div className="grid gap-2">
              {presets.map((preset) => {
                const selected = selectedPresetType === preset.type;
                const style = watchlistTypeStyle[preset.type];

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetType(preset.type);
                      setCustomListName("");
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5 text-left transition",
                      selected
                        ? "border-[var(--ik-accent)] bg-[var(--ik-accent-soft)]"
                        : "border-[var(--ik-rule)] bg-[var(--ik-field-bg)] hover:border-[var(--ik-accent-2)]"
                    )}
                  >
                    <span
                      className={cn("size-3 rounded-[3px]", style.dotClass)}
                    />
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold text-[var(--ik-ink)]">
                        {preset.label}
                      </div>
                      <div className="text-[11px] text-[var(--ik-ink-3)]">
                        {preset.description}
                      </div>
                    </div>
                    {selected && (
                      <Check
                        size={16}
                        weight="bold"
                        className="text-[var(--ik-accent-deep)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--ik-rule)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
                Or custom list name
              </span>
              <div className="h-px flex-1 bg-[var(--ik-rule)]" />
            </div>

            <input
              value={customListName}
              onChange={(event) => {
                setCustomListName(event.target.value);
                setSelectedPresetType("custom");
              }}
              placeholder="e.g. Dividend picks, High growth, PSU banks..."
              className="h-10 w-full rounded-lg border border-[var(--ik-rule)] bg-[rgba(91,114,160,0.07)] px-3 text-sm text-[var(--ik-ink)] outline-none transition focus:border-[var(--ik-accent-2)] focus:bg-white"
            />
          </div>
        )}

        {/* STEP 2: SELECT STOCKS (Create Mode) */}
        {mode === "create" && step === 2 && (
          <div className="flex flex-1 flex-col">
            <div className="border-b border-[var(--ik-rule-2)] px-[18px] py-3.5">
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--ik-rule)] bg-[rgba(91,114,160,0.07)] px-3.5 py-2.5 focus-within:border-[var(--ik-accent-2)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_var(--ik-accent-soft)] dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
                <MagnifyingGlass size={15} className="text-[var(--ik-ink-3)]" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search NSE / BSE — type a name or ticker"
                  className="flex-1 bg-transparent font-sans text-sm text-[var(--ik-ink)] outline-none placeholder:text-[var(--ik-ink-4)]"
                />
              </div>
            </div>
            <div className="max-h-[340px] flex-1 overflow-y-auto p-1.5">
              {searchResults.map((stock) => {
                const isSelected = selectedInstruments.find(
                  (i) => i.ticker === stock.ticker
                );
                return (
                  <button
                    key={stock.ticker}
                    type="button"
                    onClick={() => toggleInstrument(stock)}
                    className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-left transition hover:bg-[var(--ik-accent-soft)] dark:hover:bg-white/[0.05]"
                  >
                    <div
                      className="grid size-[30px] place-items-center rounded-lg text-[10.5px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${stock.color[0]}, ${stock.color[1]})`,
                      }}
                    >
                      {stock.ticker.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-sans text-[13px] font-semibold text-[var(--ik-ink)]">
                        {stock.name}
                      </div>
                      <div className="mt-px font-mono text-[11px] text-[var(--ik-ink-3)]">
                        {stock.ticker} · {stock.sector}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 px-2 text-right">
                      <div className="font-mono text-[13px] font-semibold text-[var(--ik-ink)]">
                        ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-bold",
                          stock.change >= 0
                            ? "bg-[var(--ik-good-soft)] text-[var(--ik-good)]"
                            : "bg-[var(--ik-danger-soft)] text-[var(--ik-danger)]"
                        )}
                      >
                        {stock.change >= 0 ? <CaretUp size={10} weight="bold" /> : <CaretDown size={10} weight="bold" />}
                        {Math.abs(stock.change).toFixed(2)}%
                      </div>
                    </div>

                    <div className="flex min-w-[40px] justify-end">
                      {isSelected ? (
                        <CheckCircle
                          size={22}
                          weight="fill"
                          className="text-[var(--ik-accent-deep)]"
                        />
                      ) : (
                        <div className="grid size-9 place-items-center rounded-xl bg-[#EDF3FF] text-[var(--ik-accent-deep)] transition hover:bg-[var(--ik-accent-soft)]">
                          <Plus size={18} weight="bold" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[var(--ik-rule)] bg-[var(--ik-field-bg)] px-[18px] py-4">
          <div className="font-sans text-[11px] font-medium text-[var(--ik-ink-3)]">
            {selectedInstruments.length > 0
              ? `${selectedInstruments.length} stocks selected`
              : step === 1 && mode === "add"
              ? "Select stocks to continue"
              : step === 1 && mode === "create"
              ? "Choose list type to continue"
              : ""}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-sans text-sm font-semibold text-[var(--ik-ink-3)] transition hover:bg-[var(--ik-rule-2)]"
            >
              Cancel
            </button>
            <button
              disabled={isNextDisabled}
              onClick={() => {
                if (isLastStep) {
                  handleFinish();
                } else {
                  setStep(2);
                }
              }}
              className={cn(
                "rounded-lg px-5 py-2 font-sans text-sm font-semibold text-white shadow-lg transition disabled:opacity-50",
                isNextDisabled
                  ? "bg-[var(--ik-ink-4)]"
                  : "bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))]"
              )}
            >
              {isLastStep ? (
                mode === "create" ? (
                  "Create list"
                ) : (
                  "Add to list"
                )
              ) : (
                "Next"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
