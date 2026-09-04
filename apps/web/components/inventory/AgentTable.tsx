"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Agent } from "../../lib/catalog";
import { deskOf } from "../../lib/catalog";
import { SCAN_8004 } from "../../lib/altana/chain";
import { formatU } from "../../lib/format";
import { StatusPill } from "../ui/StatusPill";

type SortKey = "name" | "live" | "price" | "status" | "registry";

export function AgentTable({ agents }: { agents: Agent[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  const rows = useMemo(() => {
    const copy = [...agents];
    copy.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      switch (sort.key) {
        case "price":
          return (BigInt(a.priceWei) > BigInt(b.priceWei) ? 1 : -1) * dir;
        case "registry":
          return (a.registryId - b.registryId) * dir;
        case "live":
          return a.liveMetric.localeCompare(b.liveMetric) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });
    return copy;
  }, [agents, sort]);

  function head(key: SortKey, label: string, extra = "") {
    const active = sort.key === key;
    return (
      <th className={`px-4 py-3 ${extra}`}>
        <button
          type="button"
          onClick={() =>
            setSort((prev) =>
              prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: "asc" },
            )
          }
          className={`font-mono text-[11px] tracking-wider uppercase ${
            active ? "text-ink underline" : "text-char hover:text-ink"
          }`}
        >
          {label}
          {active ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
        </button>
      </th>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-ink bg-bone">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/20 bg-buttercream/40">
              {head("name", "Desk & Agent", "px-6 py-3")}
              {head("live", "Live")}
              {head("price", "Price")}
              {head("status", "Status")}
              {head("registry", "ERC-8004")}
              <th className="px-6 py-3 text-right font-mono text-[11px] tracking-wider text-char uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 text-sm">
            {rows.map((agent) => {
              const desk = deskOf(agent);
              return (
                <tr
                  key={agent.id}
                  className={`hover:bg-buttercream/20 ${agent.listed ? "" : "bg-black/[0.015]"}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${desk.color}`} />
                      <div>
                        <div
                          className={`flex items-center gap-2 font-bold ${agent.listed ? "text-ink" : "text-char"}`}
                        >
                          {agent.listed ? (
                            <Link href={`/agents/${agent.id}`} className="hover:underline">
                              {agent.name}
                            </Link>
                          ) : (
                            agent.name
                          )}
                          <span className="rounded-full border border-ink/40 bg-buttercream/60 px-2 py-0.5 font-mono text-[10px] font-normal text-ink">
                            {agent.variant}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-char">
                          {desk.code} • {desk.mark.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono font-tabular">
                    <div className="font-medium">{agent.liveMetric}</div>
                    <div
                      className={`flex items-center gap-1 font-sans text-[10px] ${
                        agent.statusTone === "amber"
                          ? "text-status-amber"
                          : agent.listed
                            ? "text-status-green"
                            : "text-char"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          agent.statusTone === "amber"
                            ? "bg-status-amber"
                            : agent.listed
                              ? "bg-status-green"
                              : "bg-char"
                        }`}
                      />
                      {agent.liveHint}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold font-tabular">
                    {formatU(agent.priceWei)} $U{" "}
                    <span className="text-xs font-normal text-char">/ job</span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill label={agent.status} tone={agent.statusTone} />
                  </td>
                  <td className="px-4 py-4 font-mono font-tabular">
                    <a
                      href={SCAN_8004}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      #{agent.registryId}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {agent.listed ? (
                      <Link
                        href={`/hire/${agent.id}`}
                        className="inline-flex rounded-full border border-ink bg-marigold px-5 py-1.5 text-xs font-bold hover:bg-marigold-dim"
                      >
                        Hire
                      </Link>
                    ) : (
                      <span className="pr-2 text-xs font-medium text-char">Not listed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
