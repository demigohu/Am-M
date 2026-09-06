"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../ui/Icon";
import {
  DEFAULT_MARKET_FILTERS,
  MarketControls,
  type MarketFilters,
} from "./MarketControls";
import { StitchMarketTable } from "./StitchMarketTable";
import { AGENTS, deskBySlug, type Agent, type DeskSlug } from "../../lib/catalog";
import { sortMarketAgents, type MarketSortKey } from "../../lib/market-sort";
import { applyLive, type LiveOverlay } from "../../lib/live";

function parseCategoryParam(value: string | null): DeskSlug | "all" {
  if (!value) return "all";
  return deskBySlug(value)?.slug ?? "all";
}

function agentMatchesQuery(agent: Agent, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    agent.name.toLowerCase().includes(q) ||
    agent.id.toLowerCase().includes(q) ||
    String(agent.registryId).includes(q) ||
    agent.wallet.toLowerCase().includes(q)
  );
}

function applyFilters(agents: Agent[], filters: MarketFilters): Agent[] {
  return agents.filter((agent) => {
    if (filters.category !== "all" && agent.desk !== filters.category) return false;
    if (filters.variant !== "all" && agent.variant !== filters.variant) return false;
    if (filters.listedOnly && !agent.listed) return false;
    if (filters.liveOnly && agent.statusTone !== "green") return false;
    if (!agentMatchesQuery(agent, filters.query)) return false;
    return true;
  });
}

type MarketIndexer = {
  context: {
    venusUsdtAprBps: number;
    pcsTick: number;
    pcsLiquidity: string;
    label: string;
    takenAt: string;
  } | null;
  agents: Array<{ tokenId: number; desk: string; name: string | null; hireable: boolean }>;
};

function formatAprBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function MarketFloor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = parseCategoryParam(searchParams.get("desk"));

  const [filters, setFilters] = useState<MarketFilters>({
    ...DEFAULT_MARKET_FILTERS,
    category: categoryFromUrl,
  });
  const [live, setLive] = useState<Record<string, LiveOverlay>>({});
  const [indexer, setIndexer] = useState<MarketIndexer | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [sort, setSort] = useState<MarketSortKey>("name");
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, category: categoryFromUrl }));
  }, [categoryFromUrl]);

  const syncCategoryToUrl = useCallback(
    (category: DeskSlug | "all") => {
      const params = new URLSearchParams(searchParams.toString());
      if (category === "all") {
        params.delete("desk");
      } else {
        params.set("desk", category);
      }
      const qs = params.toString();
      router.replace(qs ? `/market?${qs}` : "/market", { scroll: false });
    },
    [router, searchParams],
  );

  const onFiltersChange = useCallback(
    (next: MarketFilters) => {
      if (next.category !== filters.category) {
        syncCategoryToUrl(next.category);
      }
      setFilters(next);
    },
    [filters.category, syncCategoryToUrl],
  );

  const onCategoryQuickFilter = useCallback(
    (desk: DeskSlug) => {
      onFiltersChange({ ...filters, category: desk });
    },
    [filters, onFiltersChange],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as {
          at?: string;
          live?: Record<string, LiveOverlay>;
          indexer?: MarketIndexer | null;
        };
        if (cancelled) return;
        setLive(body.live ?? {});
        setIndexer(body.indexer ?? null);
        setAsOf(body.at ?? new Date().toISOString());
      } catch {
        /* keep last overlay */
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const allAgents = useMemo(
    () => AGENTS.map((agent) => (live[agent.id] ? applyLive(agent, live[agent.id]!) : agent)),
    [live],
  );

  const variants = useMemo(
    () => [...new Set(allAgents.map((a) => a.variant))].sort(),
    [allAgents],
  );

  const filteredAgents = useMemo(() => {
    const scoped = applyFilters(allAgents, filters);
    return sortMarketAgents(scoped, sort, sortDesc);
  }, [allAgents, filters, sort, sortDesc]);

  const asOfLabel = asOf
    ? `${Math.max(1, Math.round((Date.now() - new Date(asOf).getTime()) / 60_000))} minute${Math.round((Date.now() - new Date(asOf).getTime()) / 60_000) === 1 ? "" : "s"} ago`
    : "fetching…";

  return (
    <section className="w-full border-b-2 border-ink bg-buttercream px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 border-b border-ink/20 pb-4 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-ink bg-bone px-2.5 py-0.5 font-mono text-[11px] tracking-wider uppercase">
                BNB Chain Testnet
              </span>
              <span className="inline-flex items-center rounded border border-ink bg-marigold px-2 py-0.5 font-mono text-[11px] font-bold">
                HIREABLE SELLERS
              </span>
            </div>
            <h1 className="m-0 font-display text-[28px] font-extrabold tracking-tight md:text-[38px] md:leading-[44px]">
              Market
            </h1>
            <p className="m-0 text-[15px] leading-relaxed text-char md:text-base">
              Browse agents, filter by job type, hire with a bounded session. Keys stay in your
              vault.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 self-start rounded-xl border border-ink bg-bone px-3 py-2 md:self-auto">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full border border-ink bg-status-green" />
            <span className="font-mono text-[11px] text-ink">
              {filteredAgents.length} shown · {AGENTS.length} total
            </span>
          </div>
        </div>

        <MarketControls
          filters={filters}
          variants={variants}
          sort={sort}
          sortDesc={sortDesc}
          onFiltersChange={onFiltersChange}
          onSortChange={(k, desc) => {
            setSort(k as MarketSortKey);
            setSortDesc(desc);
          }}
        />

        {indexer?.context ? (
          <div className="rounded-xl border border-ink bg-[#f7eeca] px-4 py-3 font-mono text-[11px] text-ink">
            <span className="mr-2 rounded-full border border-ink bg-bone px-2 py-0.5 font-bold uppercase">
              Context (mainnet)
            </span>
            Venus USDT APR ~{formatAprBps(indexer.context.venusUsdtAprBps)} · PCS WBNB/USDT tick{" "}
            {indexer.context.pcsTick} · via indexer
          </div>
        ) : null}

        <StitchMarketTable agents={filteredAgents} onCategoryFilter={onCategoryQuickFilter} />

        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 font-mono text-[11px] text-char">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-status-green" />
            <span>
              as of {asOfLabel} • testnet execution • mainnet figures labeled Context (mainnet)
            </span>
          </div>
          <div className="font-mono text-[11px] tracking-wider text-char uppercase">
            GET /strategy on each seller
          </div>
        </div>

        <div className="mt-2 w-full rounded-[20px] border border-ink bg-oat p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex max-w-2xl flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full border border-ink bg-bone px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider">
                  ERC-8004 REGISTRY
                </span>
                <span className="font-mono text-[11px] font-medium text-ink/80">
                  Identity directory · not hireable
                </span>
              </div>
              <h2 className="mt-1 font-display text-xl font-bold">
                Cryptographic Provenance &amp; Agent Attestation
              </h2>
              <p className="text-[15px] text-ink/85">
                First-party sellers only. ERC-8004 ids 2056–2059 are proof of identity, not a
                prerequisite to pick a job.
                {indexer?.agents.length ? (
                  <>
                    {" "}
                    Registry synced:{" "}
                    {indexer.agents
                      .filter((a) => a.hireable)
                      .map((a) => a.name ?? `#${a.tokenId}`)
                      .join(" · ")}
                    .
                  </>
                ) : null}
              </p>
            </div>
            <a
              href="https://8004scan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-ink bg-bone px-5 py-3 text-sm font-bold transition-colors hover:bg-buttercream"
            >
              <span>Inspect raw agent registry on 8004scan</span>
              <Icon name="arrow_outward" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketFloorFallback() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-12">
      <p className="font-mono text-[13px] text-char">Loading market…</p>
    </section>
  );
}
