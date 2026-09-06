import type { Desk } from "./addresses";

const STRATEGY_URLS: Record<Desk, string> = {
  rebalance:
    process.env.STRATEGY_URL_REBALANCE?.trim() ?? "https://rebalancing.ammlabs.fun/strategy",
  grid: process.env.STRATEGY_URL_GRID?.trim() ?? "https://gridtrading.ammlabs.fun/strategy",
  yield: process.env.STRATEGY_URL_YIELD?.trim() ?? "https://yieldrouter.ammlabs.fun/strategy",
  guard: process.env.STRATEGY_URL_GUARD?.trim() ?? "https://healthfactor.ammlabs.fun/strategy",
};

type StrategyReport = {
  variant?: string;
  at?: string;
  action?: { kind?: string; reason?: string };
  execution?: { transactionHash?: string; status?: string };
  snapshot?: Record<string, unknown>;
};

type StrategyBody = {
  running?: boolean;
  last?:
    | { idle?: string; skipped?: string }
    | StrategyReport[];
};

const cache = new Map<Desk, { at: number; summary: string | null; payload: unknown }>();
const CACHE_MS = 30_000;

function latestReport(body: StrategyBody): StrategyReport | null {
  const last = body.last;
  if (!last || !Array.isArray(last) || last.length === 0) return null;
  return last[last.length - 1] ?? null;
}

function summarizeDesk(desk: Desk, snap: Record<string, unknown>): string | null {
  switch (desk) {
    case "guard": {
      const hf = snap.healthFactor;
      if (typeof hf === "number") return `Health factor ${hf.toFixed(2)}`;
      return null;
    }
    case "yield": {
      const markets = snap.markets as Array<{ symbol?: string; supplyAprApprox?: number }> | undefined;
      const first = markets?.[0];
      if (first?.supplyAprApprox != null) {
        return `${first.symbol ?? "vToken"} ${(first.supplyAprApprox * 100).toFixed(2)}% APR`;
      }
      return null;
    }
    case "rebalance": {
      const positions = snap.positions as Array<{ inRange?: boolean }> | undefined;
      const live = positions?.find((p) => p.inRange != null);
      if (live) return live.inRange ? "LP in range" : "LP out of range — rebalance pending";
      if (typeof snap.tick === "number") return `Pool tick ${snap.tick}`;
      return null;
    }
    case "grid": {
      if (typeof snap.tick === "number") return `Grid tick ${snap.tick}`;
      return null;
    }
    default:
      return null;
  }
}

export async function fetchDeskDeliverable(
  desk: Desk,
): Promise<{ summary: string | null; payload: unknown }> {
  const hit = cache.get(desk);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return { summary: hit.summary, payload: hit.payload };
  }
  const url = STRATEGY_URLS[desk];
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4_000) });
    if (!res.ok) {
      return { summary: null, payload: null };
    }
    const body = (await res.json()) as StrategyBody;
    const report = latestReport(body);
    const snap = report?.snapshot ?? {};
    const summary = summarizeDesk(desk, snap);
    const payload = {
      at: report?.at ?? null,
      kind: report?.action?.kind ?? null,
      reason: report?.action?.reason ?? null,
      txHash: report?.execution?.transactionHash ?? null,
      snapshot: snap,
    };
    cache.set(desk, { at: Date.now(), summary, payload });
    return { summary, payload };
  } catch {
    return { summary: null, payload: null };
  }
}
