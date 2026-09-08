type SnapshotRow = {
  vUsdtUnderlying: bigint;
  vUsdcUnderlying: bigint;
  vBnbUnderlying: bigint;
  takenAt: bigint;
};

type ExecutionRow = {
  txHash: string;
};

export type SessionMetrics = {
  executionCount: number;
  strategyTxCount: number;
  snapshotCount: number;
  netYieldUsdt: string;
  netYieldUsdc: string;
  netYieldBnb: string;
  gasSpentWei: string;
  positionSummary: string | null;
};

function formatUnderlying(raw: bigint, decimals: number): string | null {
  if (raw === 0n) return null;
  const n = Number(raw) / 10 ** decimals;
  if (!Number.isFinite(n) || n < 1e-8) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function snapshotSummary(snapshots: SnapshotRow[]): string | null {
  const latest = snapshots[0];
  if (!latest) return null;
  const parts: string[] = [];
  const usdt = formatUnderlying(latest.vUsdtUnderlying, 18);
  const usdc = formatUnderlying(latest.vUsdcUnderlying, 18);
  const bnb = formatUnderlying(latest.vBnbUnderlying, 18);
  if (usdt) parts.push(`${usdt} USDT in Venus`);
  if (usdc) parts.push(`${usdc} USDC in Venus`);
  if (bnb) parts.push(`${bnb} BNB in Venus`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function computeSessionMetrics(
  snapshots: SnapshotRow[],
  executions: ExecutionRow[],
  gasSpentWei = 0n,
): SessionMetrics {
  const sorted = [...snapshots].sort((a, b) => Number(a.takenAt - b.takenAt));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const netYieldUsdt =
    first && latest && sorted.length > 1
      ? (latest.vUsdtUnderlying - first.vUsdtUnderlying).toString()
      : "0";
  const netYieldUsdc =
    first && latest && sorted.length > 1
      ? (latest.vUsdcUnderlying - first.vUsdcUnderlying).toString()
      : "0";
  const netYieldBnb =
    first && latest && sorted.length > 1
      ? (latest.vBnbUnderlying - first.vBnbUnderlying).toString()
      : "0";

  return {
    executionCount: executions.length,
    strategyTxCount: new Set(executions.map((e) => e.txHash)).size,
    snapshotCount: snapshots.length,
    netYieldUsdt,
    netYieldUsdc,
    netYieldBnb,
    gasSpentWei: gasSpentWei.toString(),
    positionSummary: snapshotSummary(sorted.length > 0 ? [sorted[sorted.length - 1]!] : []),
  };
}

export function computeAccountPnl(
  sessions: Array<{ metrics: SessionMetrics }>,
): {
  netYieldUsdt: string;
  gasSpentWei: string;
  strategyTxCount: number;
  activeSessions: number;
} {
  let netYieldUsdt = 0n;
  let gasSpentWei = 0n;
  let strategyTxCount = 0;
  for (const session of sessions) {
    strategyTxCount += session.metrics.strategyTxCount;
    try {
      netYieldUsdt += BigInt(session.metrics.netYieldUsdt);
      gasSpentWei += BigInt(session.metrics.gasSpentWei);
    } catch {
      /* skip bad bigint */
    }
  }
  return {
    netYieldUsdt: netYieldUsdt.toString(),
    gasSpentWei: gasSpentWei.toString(),
    strategyTxCount,
    activeSessions: sessions.length,
  };
}
