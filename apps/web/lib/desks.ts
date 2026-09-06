import type { Agent, Desk, DeskSlug } from "./catalog";

export type DeskMetricColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  sortKey?: string;
  value: (agent: Agent) => string;
};

/** Desk-specific table columns per PRD §10 — same aisle template, different metrics. */
export const DESK_METRIC_COLUMNS: Record<DeskSlug, DeskMetricColumn[]> = {
  rebalance: [
    { key: "pair", label: "Target", sortKey: "pair", value: (a) => a.pair },
    {
      key: "live",
      label: "/strategy",
      align: "right",
      sortKey: "live",
      value: (a) => a.liveMetric,
    },
    {
      key: "action",
      label: "Last action",
      sortKey: "action",
      value: (a) => a.lastAction,
    },
  ],
  grid: [
    { key: "pair", label: "Pair", sortKey: "pair", value: (a) => a.pair },
    {
      key: "fills",
      label: "Fills",
      align: "right",
      value: () => "Not indexed yet",
    },
    {
      key: "pnl",
      label: "PnL",
      align: "right",
      value: () => "Not indexed yet",
    },
    {
      key: "winRate",
      label: "Win rate",
      align: "right",
      value: () => "Not indexed yet",
    },
    {
      key: "drawdown",
      label: "Drawdown",
      align: "right",
      value: () => "Not indexed yet",
    },
  ],
  yield: [
    { key: "pair", label: "Markets", sortKey: "pair", value: (a) => a.pair },
    {
      key: "aprTestnet",
      label: "Live (testnet)",
      align: "right",
      sortKey: "live",
      value: (a) => a.liveMetric,
    },
    {
      key: "aprContext",
      label: "Context (mainnet)",
      align: "right",
      value: () => "Not indexed yet",
    },
  ],
  guard: [
    { key: "pair", label: "Account", sortKey: "pair", value: (a) => a.pair },
    {
      key: "hf",
      label: "Health factor",
      align: "right",
      sortKey: "live",
      value: (a) => a.liveMetric,
    },
    {
      key: "liqPrice",
      label: "Liquidation price",
      align: "right",
      value: () => "Not indexed yet",
    },
    {
      key: "buffer",
      label: "Buffer",
      align: "right",
      value: () => "Not indexed yet",
    },
  ],
};

export function deskToolbarLabel(desk: Desk, agentCount: number): string {
  const count = agentCount === 1 ? "1 seller" : `${agentCount} sellers`;
  return `${desk.name} · ${count}`;
}
