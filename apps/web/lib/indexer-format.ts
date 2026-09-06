/** Format raw underlying bigint strings from the indexer for display. */
export function formatIndexerUnderlying(raw: string | undefined, decimals = 18): string | null {
  if (!raw || raw === "0") return null;
  try {
    const v = BigInt(raw);
    if (v === 0n) return null;
    const n = Number(v) / 10 ** decimals;
    if (!Number.isFinite(n)) return null;
    if (Math.abs(n) < 0.0001) return null;
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  } catch {
    return null;
  }
}

export function formatNetYieldLabel(raw: string | undefined, symbol: string): string | null {
  const formatted = formatIndexerUnderlying(raw);
  if (!formatted) return null;
  return `${formatted} ${symbol}`;
}

export function formatGasSpent(raw: string | undefined): string | null {
  if (!raw || raw === "0") return null;
  try {
    const wei = BigInt(raw);
    if (wei === 0n) return null;
    const bnb = Number(wei) / 1e18;
    if (!Number.isFinite(bnb) || bnb < 0.000001) return "<0.000001 tBNB";
    return `${bnb.toLocaleString(undefined, { maximumFractionDigits: 6 })} tBNB`;
  } catch {
    return null;
  }
}
