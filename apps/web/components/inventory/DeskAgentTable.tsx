"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Agent, Desk } from "../../lib/catalog";
import { DESK_METRIC_COLUMNS, type DeskMetricColumn } from "../../lib/desks";
import { SCAN_8004 } from "../../lib/altana/chain";
import { formatU } from "../../lib/format";
import { StatusPill } from "../ui/StatusPill";

type SortKey = string;

export function DeskAgentTable({ desk, agents }: { desk: Desk; agents: Agent[] }) {
  const columns = DESK_METRIC_COLUMNS[desk.slug];
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: columns[0]?.sortKey ?? columns[0]?.key ?? "name",
    dir: "asc",
  });

  const rows = useMemo(() => {
    const copy = [...agents];
    copy.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "price") {
        return (BigInt(a.priceWei) > BigInt(b.priceWei) ? 1 : -1) * dir;
      }
      if (sort.key === "name") {
        return a.name.localeCompare(b.name) * dir;
      }
      const col = columns.find((c) => (c.sortKey ?? c.key) === sort.key);
      if (col) {
        return col.value(a).localeCompare(col.value(b)) * dir;
      }
      return 0;
    });
    return copy;
  }, [agents, columns, sort]);

  function head(col: DeskMetricColumn) {
    const sortable = col.sortKey ?? col.key;
    const active = sort.key === sortable;
    const align =
      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "";
    return (
      <th key={col.key} className={`border-r border-ink/20 px-4 py-3.5 ${align}`}>
        {col.sortKey ? (
          <button
            type="button"
            onClick={() =>
              setSort((prev) =>
                prev.key === sortable
                  ? { key: sortable, dir: prev.dir === "asc" ? "desc" : "asc" }
                  : { key: sortable, dir: "asc" },
              )
            }
            className={`font-mono text-[12px] tracking-wider uppercase ${
              active ? "text-ink underline" : "hover:text-ink"
            }`}
          >
            {col.label}
            {active ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
          </button>
        ) : (
          <span className="font-mono text-[12px] tracking-wider uppercase">{col.label}</span>
        )}
      </th>
    );
  }

  return (
    <section className="mb-8 overflow-hidden rounded-[20px] border-2 border-ink bg-bone">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink bg-oat/30">
              <th className="border-r border-ink/20 px-4 py-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setSort((prev) =>
                      prev.key === "name"
                        ? { key: "name", dir: prev.dir === "asc" ? "desc" : "asc" }
                        : { key: "name", dir: "asc" },
                    )
                  }
                  className={`font-mono text-[12px] tracking-wider uppercase ${
                    sort.key === "name" ? "text-ink underline" : "hover:text-ink"
                  }`}
                >
                  Agent
                  {sort.key === "name" ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
                </button>
              </th>
              {columns.map((col) => head(col))}
              <th className="border-r border-ink/20 px-4 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() =>
                    setSort((prev) =>
                      prev.key === "price"
                        ? { key: "price", dir: prev.dir === "asc" ? "desc" : "asc" }
                        : { key: "price", dir: "asc" },
                    )
                  }
                  className={`font-mono text-[12px] tracking-wider uppercase ${
                    sort.key === "price" ? "text-ink underline" : "hover:text-ink"
                  }`}
                >
                  Fee
                  {sort.key === "price" ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
                </button>
              </th>
              <th className="border-r border-ink/20 px-4 py-3.5">
                <span className="font-mono text-[12px] tracking-wider uppercase">Status</span>
              </th>
              <th className="px-4 py-3.5 text-center font-mono text-[12px] tracking-wider uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink">
            {rows.map((agent) => (
              <tr key={agent.id} className="hover:bg-buttercream/30">
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
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`border-r border-ink/10 px-4 py-4 font-mono ${
                      col.align === "right" ? "text-right font-bold" : "text-[13px]"
                    }`}
                  >
                    {col.value(agent)}
                  </td>
                ))}
                <td className="border-r border-ink/10 px-4 py-4 text-right font-mono font-bold">
                  {formatU(agent.priceWei)} $U{" "}
                  <span className="text-[13px] font-normal text-char">/ job</span>
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
