import { COMPTROLLER, type Address } from "./addresses.js";

const VENUS_API_URL =
  process.env.VENUS_API_URL?.trim() ?? "https://testnetapi.venus.io";
const CORE = COMPTROLLER.toLowerCase();

export type CorePoolMarketQuote = {
  vToken: Address;
  symbol: string;
  underlying: Address;
  underlyingSymbol: string;
  underlyingDecimals: number;
  native: boolean;
  /** Base supply APY as decimal (e.g. 0.42 = 42%). From Venus API. */
  supplyApy: number;
};

type VenusApiMarket = {
  address: string;
  symbol: string;
  underlyingAddress: string;
  underlyingSymbol: string;
  underlyingDecimal: string | number;
  supplyApyDecimal?: string | null;
  isListed?: boolean;
  poolComptrollerAddress?: string;
  pausedActionsBitmap?: number;
};

let cache: { at: number; markets: CorePoolMarketQuote[] } | null = null;
const CACHE_MS = 60_000;

function parseApy(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Rankable Venus Core Pool catalog from testnetapi.venus.io (cached 60s). */
export async function fetchCorePoolMarkets(): Promise<CorePoolMarketQuote[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.markets;
  }
  const url = new URL(`${VENUS_API_URL}/markets`);
  url.searchParams.set("chainId", "97");
  url.searchParams.set("limit", "100");
  const res = await fetch(url, {
    headers: { "accept-version": "next" },
  });
  if (!res.ok) {
    throw new Error(`Venus API /markets ${res.status}`);
  }
  const body = (await res.json()) as { result?: VenusApiMarket[] };
  const seen = new Set<string>();
  const markets: CorePoolMarketQuote[] = [];
  for (const row of body.result ?? []) {
    if (row.poolComptrollerAddress?.toLowerCase() !== CORE) continue;
    if (row.isListed === false) continue;
    if ((row.pausedActionsBitmap ?? 0) !== 0) continue;
    const vToken = row.address.toLowerCase();
    if (seen.has(vToken)) continue;
    seen.add(vToken);
    markets.push({
      vToken: row.address as Address,
      symbol: row.symbol,
      underlying: row.underlyingAddress as Address,
      underlyingSymbol: row.underlyingSymbol,
      underlyingDecimals: Number(row.underlyingDecimal) || 18,
      native: row.underlyingSymbol === "BNB",
      supplyApy: parseApy(row.supplyApyDecimal),
    });
  }
  markets.sort((a, b) => b.supplyApy - a.supplyApy);
  cache = { at: Date.now(), markets };
  return markets;
}
