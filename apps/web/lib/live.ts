import type { Agent, StatusTone } from "./catalog";
import { AGENTS } from "./catalog";

export type LiveOverlay = {
  reachable: boolean;
  running: boolean;
  status: string;
  statusTone: StatusTone;
  liveMetric: string;
  liveHint: string;
  lastAction: string;
  variant?: string;
  inRange?: string;
  at?: string;
};

type StrategyBody = {
  running?: boolean;
  last?:
    | { idle?: string; skipped?: string }
    | Array<{
        variant?: string;
        at?: string;
        action?: { kind?: string; reason?: string };
        execution?: { transactionHash?: string; status?: string };
        snapshot?: Record<string, unknown>;
      }>;
};

const TIMEOUT_MS = 4_000;

function idleOverlay(reason: string): LiveOverlay {
  return {
    reachable: true,
    running: false,
    status: "Idle",
    statusTone: "amber",
    liveMetric: "no user session",
    liveHint: "Live · /strategy",
    lastAction: reason,
  };
}

function fromReport(
  report: Extract<StrategyBody["last"], unknown[]>[number],
  desk: Agent["desk"],
): LiveOverlay {
  const kind = report.action?.kind ?? "noop";
  const reason = report.action?.reason ?? "—";
  const snap = report.snapshot ?? {};
  let liveMetric = kind;
  let inRange: string | undefined;
  if (desk === "guard" && typeof snap.healthFactor === "number") {
    liveMetric = `HF ${snap.healthFactor.toFixed(2)}`;
  } else if (desk === "yield" && Array.isArray(snap.markets)) {
    const first = snap.markets[0] as { symbol?: string; supplyAprApprox?: number } | undefined;
    if (first?.supplyAprApprox != null) {
      liveMetric = `${first.symbol ?? "vToken"} ${(first.supplyAprApprox * 100).toFixed(2)}% APR`;
    }
  } else if (desk === "rebalance") {
    const positions = snap.positions as Array<{ inRange?: boolean }> | undefined;
    const live = positions?.find((p) => p.inRange != null);
    if (live) {
      inRange = live.inRange ? "in range" : "out of range";
      liveMetric = inRange;
    } else if (typeof snap.tick === "number") {
      liveMetric = `tick ${snap.tick}`;
    }
  } else if (desk === "grid" && typeof snap.tick === "number") {
    liveMetric = `tick ${snap.tick}`;
  }
  const tone: StatusTone = kind === "execute" ? "green" : kind === "blocked" ? "amber" : "green";
  const tx = report.execution?.transactionHash;
  return {
    reachable: true,
    running: true,
    status: kind,
    statusTone: tone,
    liveMetric,
    liveHint: "Live · /strategy",
    lastAction: tx ? `${reason} · ${tx.slice(0, 10)}…` : reason,
    variant: report.variant,
    inRange,
    at: report.at,
  };
}

export function parseStrategy(body: StrategyBody, agent: Agent): LiveOverlay {
  const last = body.last;
  if (last && !Array.isArray(last) && typeof last.idle === "string") {
    return idleOverlay(last.idle);
  }
  if (last && !Array.isArray(last) && typeof last.skipped === "string") {
    return {
      reachable: true,
      running: Boolean(body.running),
      status: "Busy",
      statusTone: "amber",
      liveMetric: "tick overlap",
      liveHint: "Live · /strategy",
      lastAction: last.skipped,
    };
  }
  if (Array.isArray(last) && last.length > 0) {
    return fromReport(last[last.length - 1]!, agent.desk);
  }
  return {
    reachable: true,
    running: Boolean(body.running),
    status: "Up",
    statusTone: "green",
    liveMetric: "no ticks yet",
    liveHint: "Live · /strategy",
    lastAction: "—",
  };
}

export async function fetchAgentLive(agent: Agent): Promise<LiveOverlay> {
  try {
    const res = await fetch(agent.strategyUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return {
        reachable: false,
        running: false,
        status: "Unreachable",
        statusTone: "char",
        liveMetric: `HTTP ${res.status}`,
        liveHint: agent.strategyUrl,
        lastAction: "—",
      };
    }
    const body = (await res.json()) as StrategyBody;
    return parseStrategy(body, agent);
  } catch {
    return {
      reachable: false,
      running: false,
      status: "Unreachable",
      statusTone: "char",
      liveMetric: "no /strategy",
      liveHint: agent.strategyUrl,
      lastAction: "—",
    };
  }
}

export function applyLive(agent: Agent, live: LiveOverlay): Agent {
  return {
    ...agent,
    status: live.status,
    statusTone: live.statusTone,
    liveMetric: live.liveMetric,
    liveHint: live.liveHint,
    lastAction: live.lastAction,
    variant: live.variant ?? agent.variant,
    inRange: live.inRange ?? agent.inRange,
  };
}

export async function fetchAllLive(): Promise<Record<string, LiveOverlay>> {
  const entries = await Promise.all(
    AGENTS.map(async (agent) => [agent.id, await fetchAgentLive(agent)] as const),
  );
  return Object.fromEntries(entries);
}
