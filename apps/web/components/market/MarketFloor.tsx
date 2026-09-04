"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentTable } from "../inventory/AgentTable";
import { AGENTS, DESKS, type Agent, type DeskSlug } from "../../lib/catalog";
import { applyLive, type LiveOverlay } from "../../lib/live";

export function MarketFloor() {
  const [desk, setDesk] = useState<"all" | DeskSlug>("all");
  const [live, setLive] = useState<Record<string, LiveOverlay>>({});
  const [asOf, setAsOf] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as { at?: string; live?: Record<string, LiveOverlay> };
        if (cancelled) return;
        setLive(body.live ?? {});
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

  const agents = useMemo(() => {
    const merged: Agent[] = AGENTS.map((agent) =>
      live[agent.id] ? applyLive(agent, live[agent.id]!) : agent,
    );
    return desk === "all" ? merged : merged.filter((a) => a.desk === desk);
  }, [desk, live]);

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-grow px-6 py-10">
      <section className="mb-8">
        <div className="flex flex-col justify-between gap-6 border-b border-ink/20 pb-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-bone px-3 py-0.5 font-mono text-xs font-medium">
                <span className="h-2 w-2 animate-pulse rounded-full bg-status-green" />
                Live (testnet)
              </span>
              <span className="ml-1 font-mono text-xs text-char">CHAIN_ID: 97</span>
            </div>
            <h1 className="font-display text-[38px] leading-tight font-extrabold tracking-tight">
              Compare the four jobs
            </h1>
            <p className="mt-1.5 text-base text-char">
              Sort by the number that matters for the desk. Idle{" "}
              <code className="font-mono text-sm">/strategy</code> means no user session on that
              seller yet — not a fake APY.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-full border border-ink bg-bone px-4 py-2 font-mono text-xs">
            <div>
              <span className="text-char">CHAIN:</span> <span className="font-bold">97</span>
            </div>
            <span className="text-oat">|</span>
            <div>
              <span className="text-char">POLL:</span> <span className="font-bold">15s</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDesk("all")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium ${
              desk === "all" ? "bg-ink text-bone" : "border border-ink bg-buttercream hover:bg-bone"
            }`}
          >
            All Desks
          </button>
          {DESKS.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => setDesk(d.slug)}
              className={`flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-medium ${
                desk === d.slug
                  ? "bg-ink text-bone"
                  : "border border-ink bg-buttercream hover:bg-bone"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${d.color}`} />
              {d.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-medium">Sellers</h2>
          <span className="font-mono text-xs tracking-wider text-char uppercase">
            {agents.length} sellers on ammlabs.fun
          </span>
        </div>
        <AgentTable agents={agents} />
        <div className="mt-3 flex items-center justify-between px-2 text-[13px] text-char">
          <p>
            as of{" "}
            <span className="font-mono text-ink">
              {asOf ? new Date(asOf).toISOString().replace("T", " ").slice(0, 19) : "fetching…"} UTC
            </span>{" "}
            • GET /strategy on each seller
          </p>
          <p className="font-mono text-xs">ERC-8004 #2056–#2059</p>
        </div>
      </section>

      <section className="mt-8 mb-4 rounded-[20px] border border-ink bg-oat p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-bone uppercase">
                Identity Directory
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-ink/80">
              First-party sellers only. ERC-8004 ids 2056–2059 are proof of identity, not a
              prerequisite to pick a job.{" "}
              <code className="font-mono">0x8004A818BFB912233c491871b3d84c89A494BD9e</code>
            </p>
          </div>
          <a
            href="https://8004scan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink bg-bone px-5 py-2.5 text-sm font-bold hover:bg-buttercream"
          >
            Inspect registry on 8004scan <span className="text-xs">↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}
