"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../ui/Icon";
import { DESKS, type DeskSlug } from "../../lib/catalog";
import { DESK_HEX } from "../../lib/stitch-styles";

export type MarketFilters = {
  category: DeskSlug | "all";
  variant: string | "all";
  listedOnly: boolean;
  liveOnly: boolean;
  query: string;
};

export const DEFAULT_MARKET_FILTERS: MarketFilters = {
  category: "all",
  variant: "all",
  listedOnly: false,
  liveOnly: false,
  query: "",
};

export function countActiveFilters(filters: MarketFilters): number {
  let n = 0;
  if (filters.category !== "all") n += 1;
  if (filters.variant !== "all") n += 1;
  if (filters.listedOnly) n += 1;
  if (filters.liveOnly) n += 1;
  if (filters.query.trim()) n += 1;
  return n;
}

const SORT_LABELS: Record<string, string> = {
  "name-false": "Name (A → Z)",
  "name-true": "Name (Z → A)",
  "live-true": "Live metric (high → low)",
  "live-false": "Live metric (low → high)",
  "price-true": "Price (high → low)",
  "price-false": "Price (low → high)",
  "reputation-true": "Reputation (high → low)",
  "reputation-false": "Reputation (low → high)",
  "variant-false": "Variant (A → Z)",
  "variant-true": "Variant (Z → A)",
};

type MarketControlsProps = {
  filters: MarketFilters;
  variants: string[];
  sort: string;
  sortDesc: boolean;
  onFiltersChange: (next: MarketFilters) => void;
  onSortChange: (sort: string, desc: boolean) => void;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block font-mono text-[11px] font-semibold tracking-wider text-char uppercase">
      {children}
    </span>
  );
}

function SelectShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <Icon
        name="expand_more"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[20px] text-char"
      />
    </div>
  );
}

const selectClass =
  "h-11 w-full appearance-none rounded-xl border-2 border-ink bg-bone py-0 pl-3.5 pr-10 text-[15px] outline-none focus:border-[2.5px] focus:border-ink";

export function MarketControls({
  filters,
  variants,
  sort,
  sortDesc,
  onFiltersChange,
  onSortChange,
}: MarketControlsProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(filters);

  useEffect(() => {
    if (!filterOpen) return;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [filterOpen]);

  function patch(partial: Partial<MarketFilters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  function clearAll() {
    onFiltersChange({ ...DEFAULT_MARKET_FILTERS });
  }

  const sortKey = `${sort}-${sortDesc}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Icon name="search" className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[20px] text-char" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => patch({ query: e.target.value })}
            placeholder="Search by agent name, registry ID, or address"
            className="h-11 w-full rounded-xl border-2 border-ink bg-bone pr-4 pl-11 text-[15px] outline-none placeholder:text-char focus:border-[2.5px] focus:border-ink"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SelectShell className="min-w-[200px]">
            <select
              value={sortKey}
              onChange={(e) => {
                const [k, d] = e.target.value.split("-");
                onSortChange(k!, d === "true");
              }}
              className={selectClass}
              aria-label="Sort agents"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </SelectShell>

          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className={`inline-flex h-11 items-center gap-2 rounded-xl border-2 border-ink px-4 text-sm font-bold transition-colors ${
                filterOpen ? "bg-[#f7eeca]" : "bg-bone hover:bg-[#f7eeca]"
              }`}
              aria-expanded={filterOpen}
              aria-haspopup="true"
            >
              <Icon name="filter_list" className="text-[20px]" />
              Filters
              {activeCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 font-mono text-[11px] text-bone">
                  {activeCount}
                </span>
              ) : null}
            </button>

            {filterOpen ? (
              <div className="absolute top-[calc(100%+8px)] right-0 z-20 w-[min(100vw-2rem,360px)] rounded-[20px] border-2 border-ink bg-bone p-4 shadow-[var(--shadow-md)]">
                <div className="mb-4 flex flex-col gap-3 border-b border-ink/20 pb-4">
                  <div>
                    <FieldLabel>Network</FieldLabel>
                    <SelectShell>
                      <select className={selectClass} disabled value="bsc-testnet">
                        <option value="bsc-testnet">BNB Chain Testnet</option>
                      </select>
                    </SelectShell>
                  </div>
                  <div>
                    <FieldLabel>Job type</FieldLabel>
                    <SelectShell>
                      <select
                        className={selectClass}
                        value={filters.category}
                        onChange={(e) =>
                          patch({ category: e.target.value as DeskSlug | "all" })
                        }
                      >
                        <option value="all">All job types</option>
                        {DESKS.map((d) => (
                          <option key={d.slug} value={d.slug}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </SelectShell>
                  </div>
                  <div>
                    <FieldLabel>Strategy variant</FieldLabel>
                    <SelectShell>
                      <select
                        className={selectClass}
                        value={filters.variant}
                        onChange={(e) => patch({ variant: e.target.value })}
                      >
                        <option value="all">All variants</option>
                        {variants.map((v) => (
                          <option key={v} value={v}>
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </option>
                        ))}
                      </select>
                    </SelectShell>
                  </div>
                </div>

                <div className="mb-4 flex flex-col gap-2.5">
                  <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
                    <input
                      type="checkbox"
                      checked={filters.listedOnly}
                      onChange={(e) => patch({ listedOnly: e.target.checked })}
                      className="h-5 w-5 shrink-0 rounded border-2 border-ink accent-marigold"
                    />
                    Listed &amp; hireable only
                  </label>
                  <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
                    <input
                      type="checkbox"
                      checked={filters.liveOnly}
                      onChange={(e) => patch({ liveOnly: e.target.checked })}
                      className="h-5 w-5 shrink-0 rounded border-2 border-ink accent-marigold"
                    />
                    Live on testnet only
                  </label>
                </div>

                <button
                  type="button"
                  onClick={clearAll}
                  className="flex h-11 w-full items-center justify-center rounded-xl border-2 border-ink bg-buttercream text-sm font-bold transition-colors hover:bg-[#f7eeca]"
                >
                  Clear all filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {activeCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-char uppercase">Active</span>
          {filters.category !== "all" ? (
            <FilterPill
              label={DESKS.find((d) => d.slug === filters.category)?.name ?? filters.category}
              dot={DESK_HEX[filters.category as DeskSlug]}
              onRemove={() => patch({ category: "all" })}
            />
          ) : null}
          {filters.variant !== "all" ? (
            <FilterPill label={filters.variant} onRemove={() => patch({ variant: "all" })} />
          ) : null}
          {filters.listedOnly ? (
            <FilterPill label="Hireable" onRemove={() => patch({ listedOnly: false })} />
          ) : null}
          {filters.liveOnly ? (
            <FilterPill label="Live" onRemove={() => patch({ liveOnly: false })} />
          ) : null}
          {filters.query.trim() ? (
            <FilterPill label={`"${filters.query.trim()}"`} onRemove={() => patch({ query: "" })} />
          ) : null}
          <button type="button" onClick={clearAll} className="text-[13px] font-bold underline">
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FilterPill({
  label,
  dot,
  onRemove,
}: {
  label: string;
  dot?: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-[#f7eeca] py-1 pr-1 pl-2.5 font-mono text-[11px] font-medium capitalize">
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full border border-ink" style={{ backgroundColor: dot }} />
      ) : null}
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-bone"
        aria-label={`Remove ${label} filter`}
      >
        <Icon name="close" className="text-[14px]" />
      </button>
    </span>
  );
}
