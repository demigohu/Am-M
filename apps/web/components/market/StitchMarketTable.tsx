"use client";

import Link from "next/link";
import type { Agent, DeskSlug } from "../../lib/catalog";
import { deskOf } from "../../lib/catalog";
import { DESK_HEX } from "../../lib/stitch-styles";
import { formatU, shortAddress } from "../../lib/format";

function StatusBadge({ agent }: { agent: Agent }) {
  const tone = agent.statusTone;
  const styles =
    tone === "green"
      ? "border-status-green/40 bg-status-green/10 text-status-green"
      : tone === "amber"
        ? "border-status-amber/40 bg-status-amber/10 text-status-amber"
        : "border-char/40 bg-char/10 text-char";
  const label =
    tone === "green" ? agent.status.toUpperCase() : tone === "amber" ? "IDLE" : agent.status.toUpperCase();

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold ${styles}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${tone === "green" ? "bg-status-green" : tone === "amber" ? "bg-status-amber" : "bg-char"}`}
      />
      {label}
    </span>
  );
}

export function StitchMarketTable({
  agents,
  onCategoryFilter,
}: {
  agents: Agent[];
  onCategoryFilter?: (desk: DeskSlug) => void;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-ink bg-bone">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink bg-[#f7eeca] font-mono text-[11px] tracking-wider text-ink uppercase">
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Agent</th>
              <th className="px-3 py-3 font-semibold">Strategy</th>
              <th className="px-4 py-3 font-semibold">Live Metric</th>
              <th className="px-4 py-3 font-semibold">Price / Fee</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Reputation</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/15">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-char">
                  No agents match this filter.
                </td>
              </tr>
            ) : (
              agents.map((agent) => {
                const desk = deskOf(agent);
                const hex = DESK_HEX[agent.desk];
                return (
                  <tr key={agent.id} className="h-[68px] transition-colors hover:bg-buttercream/60">
                    <td className="px-4 py-3">
                      {onCategoryFilter ? (
                        <button
                          type="button"
                          onClick={() => onCategoryFilter(agent.desk)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors hover:bg-[#f7eeca]"
                          style={{ color: hex, backgroundColor: `${hex}26` }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
                          {desk.name.toUpperCase()}
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-1 font-mono text-[11px] font-semibold"
                          style={{ color: hex, backgroundColor: `${hex}26` }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
                          {desk.name.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        {agent.listed ? (
                          <Link href={`/agents/${agent.id}`} className="text-[15px] leading-snug font-bold hover:underline">
                            {agent.name}
                          </Link>
                        ) : (
                          <span className="text-[15px] leading-snug font-bold text-char">{agent.name}</span>
                        )}
                        <span className="font-mono text-[11px] text-char">
                          #{agent.registryId} · {shortAddress(agent.wallet)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block rounded border border-ink/40 bg-[#f1e8c5] px-2 py-0.5 text-[13px] capitalize">
                        {agent.variant}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold font-tabular">{agent.liveMetric}</td>
                    <td className="px-4 py-3 font-mono text-sm font-bold font-tabular">
                      {formatU(agent.priceWei)} $U
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge agent={agent} />
                    </td>
                    <td className="px-4 py-3">
                      {agent.reputation != null ? (
                        <div className="flex items-center gap-1 font-mono text-sm font-tabular">
                          <span className="font-bold text-[#6f5d00]">★</span>
                          <span>{agent.reputation.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-[13px] text-char">Not indexed yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {agent.listed ? (
                        <Link
                          href={`/hire/${agent.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-ink bg-marigold px-4 py-1.5 text-sm font-bold transition-transform hover:bg-marigold-dim active:translate-y-px"
                        >
                          Hire
                        </Link>
                      ) : (
                        <span className="pr-2 text-xs font-medium text-char">Not listed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
