"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAddItem,
  useCreateWatchlist,
  useInstrumentSearch,
  usePopularInstruments,
} from "@/features/watchlist/hooks";
import type {
  WatchlistPreset,
  WatchlistTab,
  WatchlistType,
} from "@/components/dynamic-view/types";
import { watchlistTypeStyle } from "@/components/watchlist/watchlist-style-registry";
import { cn } from "@/lib/utils";

interface WatchlistActionModalProps {
  mode: "add" | "create";
  onClose: () => void;
  initialWatchlistId?: string;
  lists: WatchlistTab[];
  presets: WatchlistPreset[];
}

type InstrumentResult = {
  id: string;
  instrument_id?: string;
  fincode?: string | number | null;
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string | null;
  last_price?: number | null;
  change?: number | null;
};

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}

function getInstrumentId(instrument: InstrumentResult) {
  return String(instrument.id || instrument.instrument_id || instrument.symbol);
}

export function WatchlistActionModal({
  mode,
  onClose,
  initialWatchlistId,
  lists,
  presets,
}: WatchlistActionModalProps) {
  const [step, setStep] = useState(1);

  /**
   * Create-list state.
   * Server sends only semantic preset type.
   * Client maps type to UI style through watchlistTypeStyle.
   */
  const [selectedPresetType, setSelectedPresetType] =
    useState<WatchlistType | null>(null);
  const [customListName, setCustomListName] = useState("");

  /**
   * Add-stock/search state.
   * This search always calls backend because it searches financial DB.
   */
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [selectedInstruments, setSelectedInstruments] = useState<
    InstrumentResult[]
  >([]);

  /**
   * Add mode destination.
   * Add-stock flow cannot create a new list here.
   * User can only select existing default/custom lists.
   */
  const [targetWatchlistId, setTargetWatchlistId] = useState(
    initialWatchlistId || ""
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateWatchlist();
  const addItemMutation = useAddItem();

  /**
   * ✅ These two hooks belong here.
   *
   * useInstrumentSearch(debouncedSearch)
   * - used when user types in modal search
   * - always API call through gateway
   *
   * usePopularInstruments()
   * - used when modal search is empty
   * - shows suggested/popular instruments from backend
   */

  const { data: searchResults = [], isLoading: isSearching } =
    useInstrumentSearch(debouncedSearch);

  const { data: popularInstruments = [], isLoading: isLoadingPopular } =
    usePopularInstruments();

  const searchableInstruments = searchQuery.trim()
    ? searchResults
    : popularInstruments;

  const selectableLists = useMemo(() => {
    return lists.filter((list) => list.id !== "all");
  }, [lists]);

  const selectedInstrumentIds = useMemo(() => {
    return new Set(selectedInstruments.map(getInstrumentId));
  }, [selectedInstruments]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(id);
  }, [step]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function toggleInstrument(instrument: InstrumentResult) {
    const instrumentId = getInstrumentId(instrument);

    setSelectedInstruments((prev) => {
      const exists = prev.some((item) => getInstrumentId(item) === instrumentId);

      if (exists) {
        return prev.filter((item) => getInstrumentId(item) !== instrumentId);
      }

      return [...prev, instrument];
    });
  }

  const selectedPreset = presets.find(
    (preset) => preset.type === selectedPresetType
  );

  const createListName =
    customListName.trim() || selectedPreset?.label || "My Watchlist";

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

  const isSubmitting =
    createMutation.isPending || addItemMutation.isPending;

  async function handleFinish() {
    try {
      if (mode === "create") {
        const newWatchlist = await createMutation.mutateAsync({
          name: createListName,
          type: selectedPresetType ?? "custom",
        });

        for (const instrument of selectedInstruments) {
          await addItemMutation.mutateAsync({
            watchlistId: newWatchlist.id,
            fincode: Number(instrument.fincode ?? instrument.id),
          });
        }

        toast.success("Watchlist created");
        onClose();
        return;
      }

      if (mode === "add") {
        for (const instrument of selectedInstruments) {
          await addItemMutation.mutateAsync({
            watchlistId: targetWatchlistId,
            fincode: Number(instrument.fincode ?? instrument.id),
          });
        }

        toast.success("Stocks added to list");
        onClose();
      }
    } catch {
      /**
       * Hook-level onError already shows toast.
       */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(11,37,69,0.32)] px-[18px] pt-20 backdrop-blur-md dark:bg-black/65"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[580px] flex-col overflow-hidden rounded-[18px] border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,#fff,#FAFCFF)] shadow-[0_24px_60px_-10px_rgba(43,69,112,0.4),0_1px_0_rgba(255,255,255,0.7)_inset] dark:bg-[linear-gradient(180deg,#1A1A1D,#131316)] dark:shadow-[0_24px_60px_-10px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.04)_inset]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--ik-rule)] px-[18px] py-4">
          <div className="flex items-center gap-2 font-sans text-[15px] font-semibold text-[var(--ik-ink)]">
            {mode === "create"
              ? step === 1
                ? "Create new watchlist"
                : `Add stocks to "${createListName}"`
              : step === 1
                ? "Search stock"
                : "Assign selected stocks to list"}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-lg text-[var(--ik-ink-3)] transition hover:bg-[var(--ik-rule-2)] hover:text-[var(--ik-ink)] dark:hover:bg-white/[0.06] dark:hover:text-white"
            aria-label="Close"
          >
            <X className="size-3.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {mode === "create" && step === 1 ? (
            <CreateListStep
              presets={presets}
              selectedPresetType={selectedPresetType}
              customListName={customListName}
              onSelectPreset={(type) => {
                setSelectedPresetType(type);
                setCustomListName("");
              }}
              onCustomNameChange={(value) => {
                setCustomListName(value);
                setSelectedPresetType("custom");
              }}
              inputRef={inputRef}
            />
          ) : null}

          {((mode === "add" && step === 1) ||
            (mode === "create" && step === 2)) ? (
            <InstrumentSearchStep
              inputRef={inputRef}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              instruments={searchableInstruments}
              selectedInstrumentIds={selectedInstrumentIds}
              isLoading={searchQuery.trim() ? isSearching : isLoadingPopular}
              onToggleInstrument={toggleInstrument}
            />
          ) : null}

          {mode === "add" && step === 2 ? (
            <SelectDestinationListStep
              lists={selectableLists}
              targetWatchlistId={targetWatchlistId}
              onSelect={setTargetWatchlistId}
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--ik-rule)] bg-[rgba(255,255,255,0.42)] px-[18px] py-3.5 dark:bg-white/[0.03]">
          <button
            type="button"
            onClick={() => {
              if (step > 1) {
                setStep((prev) => prev - 1);
              } else {
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ik-rule)] bg-white/65 px-3 py-2 font-sans text-xs font-medium text-[var(--ik-ink-2)] transition hover:border-[var(--ik-accent-2)] hover:bg-white/85 hover:text-[var(--ik-accent-deep)] dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            {step > 1 ? (
              <>
                <ChevronLeft className="size-4" />
                Back
              </>
            ) : (
              "Cancel"
            )}
          </button>

          <div className="flex items-center gap-2.5">
            {selectedInstruments.length > 0 ? (
              <div className="rounded-full bg-[rgba(91,114,160,0.12)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--ik-ink-3)]">
                {selectedInstruments.length} selected
              </div>
            ) : null}

            <button
              type="button"
              disabled={isNextDisabled || isSubmitting}
              onClick={() => {
                if (isLastStep) {
                  void handleFinish();
                } else {
                  setStep(2);
                }
              }}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] px-4 py-2.5 font-sans text-[13px] font-semibold text-white shadow-[0_4px_12px_-2px_rgba(43,107,255,0.45)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-45 dark:text-black"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isLastStep ? (
                <Check className="size-4" />
              ) : null}

              {isLastStep
                ? mode === "create"
                  ? "Create list"
                  : "Add to list"
                : "Next"}

              {!isLastStep ? <ChevronRight className="size-4" /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateListStep({
  presets,
  selectedPresetType,
  customListName,
  onSelectPreset,
  onCustomNameChange,
  inputRef,
}: {
  presets: WatchlistPreset[];
  selectedPresetType: WatchlistType | null;
  customListName: string;
  onSelectPreset: (type: WatchlistType) => void;
  onCustomNameChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
        Select default list type
      </div>

      <div className="grid gap-2">
        {presets.map((preset) => {
          const selected = selectedPresetType === preset.type;
          const style =
            watchlistTypeStyle[preset.type] ?? watchlistTypeStyle.custom;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.type)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5 text-left transition",
                selected
                  ? "border-[var(--ik-accent)] bg-[var(--ik-accent-soft)]"
                  : "border-[var(--ik-rule)] bg-[var(--ik-field-bg)] hover:border-[var(--ik-accent-2)]"
              )}
            >
              <span className={cn("size-3 rounded-[3px]", style.dotClass)} />

              <div className="flex-1">
                <div className="text-[14px] font-semibold text-[var(--ik-ink)]">
                  {preset.label}
                </div>
                <div className="text-[11px] text-[var(--ik-ink-3)]">
                  {preset.description}
                </div>
              </div>

              {selected ? (
                <Check
                  className="size-4 text-[var(--ik-accent-deep)]"
                  strokeWidth={2.6}
                />
              ) : null}
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
        ref={inputRef}
        value={customListName}
        onChange={(event) => onCustomNameChange(event.target.value)}
        placeholder="e.g. Dividend picks, High growth, PSU banks..."
        className="h-10 w-full rounded-lg border border-[var(--ik-rule)] bg-[var(--ik-field-bg)] px-3 text-sm text-[var(--ik-ink)] outline-none transition placeholder:text-[var(--ik-ink-4)] focus:border-[var(--ik-accent-2)]"
      />
    </div>
  );
}

function InstrumentSearchStep({
  inputRef,
  searchQuery,
  onSearchChange,
  instruments,
  selectedInstrumentIds,
  isLoading,
  onToggleInstrument,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  instruments: InstrumentResult[];
  selectedInstrumentIds: Set<string>;
  isLoading: boolean;
  onToggleInstrument: (instrument: InstrumentResult) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--ik-rule-2)] px-[18px] py-3.5">
        <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--ik-rule)] bg-[rgba(91,114,160,0.07)] px-3.5 py-2.5 focus-within:border-[var(--ik-accent-2)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_var(--ik-accent-soft)] dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
          <Search className="size-[15px] text-[var(--ik-ink-3)]" />

          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search NSE / BSE — type a name or ticker"
            className="flex-1 bg-transparent font-sans text-sm text-[var(--ik-ink)] outline-none placeholder:text-[var(--ik-ink-4)]"
          />

          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin text-[var(--ik-ink-3)]" />
          ) : null}
        </div>

        <div className="mt-2 font-mono text-[11px] tracking-[0.06em] text-[var(--ik-ink-3)]">
          Modal search always uses backend financial database.
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        <div className="px-3 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
          {searchQuery.trim() ? "Search results" : "Popular on InvestKaro"}
        </div>

        {instruments.length ? (
          instruments.map((instrument) => {
            const instrumentId = getInstrumentId(instrument);
            const selected = selectedInstrumentIds.has(instrumentId);
            const isUp = Number(instrument.change ?? 0) >= 0;

            return (
              <button
                key={instrumentId}
                type="button"
                onClick={() => onToggleInstrument(instrument)}
                className={cn(
                  "grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-left transition hover:bg-[var(--ik-accent-soft)] dark:hover:bg-white/[0.05]",
                  selected && "bg-[var(--ik-accent-soft)]"
                )}
              >
                <div className="grid size-[30px] place-items-center rounded-lg bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] font-mono text-[10.5px] font-bold text-white dark:text-black">
                  {instrument.symbol?.slice(0, 2) || "ST"}
                </div>

                <div className="min-w-0">
                  <div className="truncate font-sans text-[13px] font-semibold text-[var(--ik-ink)]">
                    {instrument.name}
                  </div>
                  <div className="mt-px font-mono text-[11px] text-[var(--ik-ink-3)]">
                    {instrument.symbol} · {instrument.exchange || "NSE"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-semibold text-[var(--ik-ink)]">
                    ₹{formatPrice(instrument.last_price)}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 inline-flex rounded-full px-1.5 py-px font-mono text-[10.5px] font-semibold",
                      isUp
                        ? "bg-[var(--ik-good-soft)] text-[var(--ik-good)]"
                        : "bg-[var(--ik-danger-soft)] text-[var(--ik-danger-deep)]"
                    )}
                  >
                    {isUp ? "+" : ""}
                    {Number(instrument.change ?? 0).toFixed(2)}%
                  </div>
                </div>

                {selected ? (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--ik-good)]">
                    <Check className="size-3" strokeWidth={3} />
                    Added
                  </div>
                ) : (
                  <div className="grid size-[30px] place-items-center rounded-lg bg-[var(--ik-accent-soft)] text-[var(--ik-accent-deep)]">
                    <Plus className="size-4" strokeWidth={2.4} />
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-5 py-9 text-center font-sans text-[13px] text-[var(--ik-ink-3)]">
            {isLoading ? "Searching..." : "No results found."}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectDestinationListStep({
  lists,
  targetWatchlistId,
  onSelect,
}: {
  lists: WatchlistTab[];
  targetWatchlistId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ik-ink-3)]">
        Assign selected stocks to list
      </div>

      <div className="grid gap-2">
        {lists.map((list) => {
          const selected = targetWatchlistId === list.id;
          const style = watchlistTypeStyle[list.type] ?? watchlistTypeStyle.custom;

          return (
            <button
              key={list.id}
              type="button"
              onClick={() => onSelect(list.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                selected
                  ? "border-[var(--ik-accent)] bg-[var(--ik-accent-soft)]"
                  : "border-[var(--ik-rule)] bg-[var(--ik-field-bg)] hover:border-[var(--ik-accent-2)]"
              )}
            >
              <span className={cn("size-2.5 rounded-full", style.dotClass)} />

              <div className="flex-1">
                <div className="text-[14px] font-semibold text-[var(--ik-ink)]">
                  {list.label}
                </div>
                <div className="text-[11px] text-[var(--ik-ink-3)]">
                  {list.source === "default" ? "Default list" : "Custom list"} ·{" "}
                  {list.count} stocks
                </div>
              </div>

              {selected ? (
                <Check
                  className="size-4 text-[var(--ik-accent-deep)]"
                  strokeWidth={2.6}
                />
              ) : null}
            </button>
          );
        })}

        {!lists.length ? (
          <div className="rounded-xl border border-[var(--ik-rule)] bg-[var(--ik-field-bg)] p-5 text-center text-sm text-[var(--ik-ink-3)]">
            No list available. Create a list first using New list.
          </div>
        ) : null}
      </div>
    </div>
  );
}