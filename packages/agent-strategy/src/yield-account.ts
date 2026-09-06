import {
  COMPTROLLER,
  USDC,
  USDT,
  VBNB,
  WBNB,
  type Address,
} from "./addresses.js";
import { COMPTROLLER_ABI, ERC20_ABI, VTOKEN_ABI } from "./abi.js";
import { publicClient } from "./rpc.js";
import type { CorePoolMarketQuote } from "./venus-api.js";

export type YieldPosition = CorePoolMarketQuote & {
  vTokenBalance: bigint;
  underlyingSupplied: bigint;
};

export type YieldWallet = {
  usdt: bigint;
  usdc: bigint;
  wbnb: bigint;
  bnb: bigint;
};

export type YieldAccount = {
  inMarkets: Address[];
  wallet: YieldWallet;
  /** Core Pool markets sorted by Venus API supply APY (desc). */
  ranked: CorePoolMarketQuote[];
  /** Markets where the wallet currently holds vTokens. */
  positions: YieldPosition[];
};

export async function readYieldAccount(
  owner: Address,
  ranked: CorePoolMarketQuote[],
): Promise<YieldAccount> {
  const byVToken = new Map(
    ranked.map((m) => [m.vToken.toLowerCase(), m] as const),
  );

  const [inMarkets, bnb, usdt, usdc, wbnb] = await Promise.all([
    publicClient.readContract({
      address: COMPTROLLER,
      abi: COMPTROLLER_ABI,
      functionName: "getAssetsIn",
      args: [owner],
    }) as Promise<Address[]>,
    publicClient.getBalance({ address: owner }),
    publicClient.readContract({
      address: USDT,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner],
    }),
    publicClient.readContract({
      address: USDC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner],
    }),
    publicClient.readContract({
      address: WBNB,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner],
    }),
  ]);

  const positions: YieldPosition[] = [];
  await Promise.all(
    inMarkets.map(async (vToken) => {
      const meta = byVToken.get(vToken.toLowerCase());
      if (!meta) return;
      const [vBal, exRate] = await Promise.all([
        publicClient.readContract({
          address: vToken,
          abi: VTOKEN_ABI,
          functionName: "balanceOf",
          args: [owner],
        }),
        publicClient.readContract({
          address: vToken,
          abi: VTOKEN_ABI,
          functionName: "exchangeRateStored",
        }),
      ]);
      if (vBal === 0n) return;
      positions.push({
        ...meta,
        vTokenBalance: vBal,
        underlyingSupplied: (vBal * exRate) / 10n ** 18n,
      });
    }),
  );

  positions.sort((a, b) =>
    a.underlyingSupplied > b.underlyingSupplied ? -1 : 1,
  );

  return {
    inMarkets,
    wallet: { usdt, usdc, wbnb, bnb },
    ranked,
    positions,
  };
}

export function walletBalanceForMarket(
  market: CorePoolMarketQuote,
  wallet: YieldWallet,
): bigint {
  if (market.native) return wallet.bnb;
  if (market.underlying.toLowerCase() === USDT.toLowerCase()) return wallet.usdt;
  if (market.underlying.toLowerCase() === USDC.toLowerCase()) return wallet.usdc;
  if (market.underlying.toLowerCase() === WBNB.toLowerCase()) return wallet.wbnb;
  return 0n;
}

export function notionalForMarket(
  market: CorePoolMarketQuote,
  variant: "conservative" | "aggressive",
): bigint {
  if (market.underlyingDecimals <= 6) return 10n ** 4n;
  return variant === "aggressive" ? 10n ** 15n : 10n ** 14n;
}

export function fmtApyPct(apy: number): string {
  return (apy * 100).toFixed(2);
}

export function snapshotYield(account: YieldAccount) {
  const best = account.ranked[0];
  return {
    corePoolMarkets: account.ranked.length,
    bestMarket: best
      ? {
          symbol: best.symbol,
          vToken: best.vToken,
          supplyApy: best.supplyApy,
          supplyApyPct: fmtApyPct(best.supplyApy),
        }
      : null,
    topMarkets: account.ranked.slice(0, 5).map((m) => ({
      symbol: m.symbol,
      supplyApyPct: fmtApyPct(m.supplyApy),
    })),
    wallet: {
      usdt: account.wallet.usdt.toString(),
      usdc: account.wallet.usdc.toString(),
      wbnb: account.wallet.wbnb.toString(),
      bnb: account.wallet.bnb.toString(),
    },
    positions: account.positions.map((p) => ({
      symbol: p.symbol,
      vToken: p.vToken,
      supplied: p.underlyingSupplied.toString(),
      supplyApyPct: fmtApyPct(p.supplyApy),
    })),
    inMarkets: account.inMarkets,
  };
}

/** vBNB uses payable mint — detect by vToken address. */
export function isNativeVToken(vToken: Address): boolean {
  return vToken.toLowerCase() === VBNB.toLowerCase();
}
