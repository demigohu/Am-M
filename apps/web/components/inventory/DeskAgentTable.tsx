"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Agent, Desk } from "../../lib/catalog";
import { SCAN_8004 } from "../../lib/altana/chain";
import { formatU } from "../../lib/format";
import { StatusPill } from "../ui/StatusPill";

type SortKey = "name" | "pair" | "live" | "action" | "price" | "status";

export function DeskAgentTable({ desk, agents }: { desk: Desk; agents: Agent[] }) {
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
        case "pair":
          return a.pair.localeCompare(b.pair) * dir;
        case "live":
          return a.liveMetric.localeCompare(b.liveMetric) * dir;
        case "action":
          return a.lastAction.localeCompare(b.lastAction) * dir;
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
      <th className={`border-r border-ink/20 px-4 py-3.5 ${extra}`}>
        <button
          type="button"
          onClick={() =>
            setSort((prev) =>
              prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: "asc" },
            )
          }
          className={`font-mono text-[12px] tracking-wider uppercase ${
            active ? "text-ink underline" : "hover:text-ink"
          }`}
        >
          {label}
          {active ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
        </button>
      </th>
    );
  }

  return (
    <section className="mb-8 overflow-hidden rounded-[20px] border-2 border-ink bg-bone">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink bg-oat">
              {head("name", "Agent")}
              {head("pair", "Target")}
              {head("live", "/strategy", "text-right")}
              {head("action", "Last action")}
              {head("price", "Fee", "text-right")}
              {head("status", "Status")}
              <th className="px-4 py-3.5 text-center font-mono text-[12px] tracking-wider uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink">
            {rows.map((agent) => (
              <tr key={agent.id} className="hover:bg-surface">
                <td className="border-r border-ink/10 px-4 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${desk.color}`} />
                    <div>
                      <Link href={`/agents/${agent.id}`} className="font-bold hover:underline">
                        {agent.name}
                      </Link>
                      <span className="mt-1 block font-mono text-[11px] uppercase text-char">
                        {agent.variant} ·{" "}
                        <a href={SCAN_8004} target="_blank" rel="noopener noreferrer" className="underline">
                          #{agent.registryId}
                        </a>
                      </span>
                    </div>
                  </div>
                </td>
                <td className="border-r border-ink/10 px-4 py-4 font-mono">{agent.pair}</td>
                <td className="border-r border-ink/10 px-4 py-4 text-right font-mono font-bold">
                  {agent.liveMetric}
                </td>
                <td className="border-r border-ink/10 px-4 py-4 font-mono text-[13px]">
                  {agent.lastAction}
                </td>
                <td className="border-r border-ink/10 px-4 py-4 text-right font-mono font-bold">
                  {formatU(agent.priceWei)} $U{" "}
                  <span className="text-[13px] font-normal text-[#7e775f]">/ job</span>
                </td>
                <td className="border-r border-ink/10 px-4 py-4">
                  <StatusPill label={agent.status} tone={agent.statusTone} />
                </td>
                <td className="px-4 py-4 text-center">
                  <Link
                    href={`/hire/${agent.id}`}
                    className="inline-flex rounded-full border-2 border-ink bg-marigold px-5 py-2 text-sm font-bold hover:bg-marigold-dim"
                  >
                    Hire
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
