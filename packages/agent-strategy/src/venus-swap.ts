import { encodeFunctionData } from "viem";
import {
  USDC,
  USDT,
  VBNB,
  VENUS_SWAP_ROUTER,
  WBNB,
  type Address,
} from "./addresses.js";
import { VENUS_SWAP_ROUTER_ABI } from "./abi.js";
import type { CorePoolMarketQuote } from "./venus-api.js";
import type { StrategyCall } from "./types.js";

const FUNDING_UNDERLYINGS = new Set(
  [USDT, USDC, WBNB].map((a) => a.toLowerCase()),
);

export function isFundingUnderlying(address: Address): boolean {
  return FUNDING_UNDERLYINGS.has(address.toLowerCase());
}

export function fundingWalletBalance(
  underlying: Address,
  wallet: { usdt: bigint; usdc: bigint; wbnb: bigint; bnb: bigint },
): bigint {
  if (underlying.toLowerCase() === USDT.toLowerCase()) return wallet.usdt;
  if (underlying.toLowerCase() === USDC.toLowerCase()) return wallet.usdc;
  if (underlying.toLowerCase() === WBNB.toLowerCase()) return wallet.wbnb;
  return 0n;
}

export function swapDeadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
}

/** PCS V2-style path via WBNB hub (Venus SwapRouter internal routing). */
export function buildV2Path(tokenIn: Address, tokenOut: Address): Address[] {
  const inL = tokenIn.toLowerCase();
  const outL = tokenOut.toLowerCase();
  if (inL === outL) return [tokenIn];
  if (inL === WBNB.toLowerCase() || outL === WBNB.toLowerCase()) {
    return [tokenIn, tokenOut];
  }
  return [tokenIn, WBNB, tokenOut];
}

export function encodeVenusSwapAndSupply(opts: {
  owner: Address;
  market: CorePoolMarketQuote;
  tokenIn: Address;
  amountIn: bigint;
}): StrategyCall | null {
  const { owner, market, tokenIn, amountIn } = opts;
  if (amountIn === 0n) return null;
  const deadline = swapDeadline();
  const minOut = 0n;

  if (market.native) {
    if (tokenIn.toLowerCase() === market.underlying.toLowerCase()) return null;
    const path = buildV2Path(tokenIn, WBNB);
    return {
      to: VENUS_SWAP_ROUTER,
      data: encodeFunctionData({
        abi: VENUS_SWAP_ROUTER_ABI,
        functionName: "swapExactTokensForBNBAndSupply",
        args: [market.vToken, amountIn, minOut, path, owner, deadline],
      }),
    };
  }

  if (tokenIn.toLowerCase() === market.underlying.toLowerCase()) return null;

  const path = buildV2Path(tokenIn, market.underlying);
  return {
    to: VENUS_SWAP_ROUTER,
    data: encodeFunctionData({
      abi: VENUS_SWAP_ROUTER_ABI,
      functionName: "swapExactTokensForTokensAndSupply",
      args: [market.vToken, amountIn, minOut, path, owner, deadline],
    }),
  };
}

export function encodeVenusNativeSwapAndSupply(opts: {
  owner: Address;
  market: CorePoolMarketQuote;
  amountIn: bigint;
}): StrategyCall | null {
  const { owner, market, amountIn } = opts;
  if (amountIn === 0n || market.native) return null;
  const path = [WBNB, market.underlying];
  return {
    to: VENUS_SWAP_ROUTER,
    value: amountIn,
    data: encodeFunctionData({
      abi: VENUS_SWAP_ROUTER_ABI,
      functionName: "swapExactETHForTokensAndSupply",
      args: [market.vToken, 0n, path, owner, swapDeadline()],
    }),
  };
}

/** Preferred funding token for Venus SwapRouter (after direct-mint path). */
export function pickFundingToken(
  market: CorePoolMarketQuote,
  wallet: { usdt: bigint; usdc: bigint; wbnb: bigint; bnb: bigint },
): { token: Address; balance: bigint; payNative?: boolean } | null {
  if (
    market.underlying.toLowerCase() === USDT.toLowerCase() &&
    wallet.usdt > 0n
  ) {
    return null;
  }
  if (
    market.underlying.toLowerCase() === USDC.toLowerCase() &&
    wallet.usdc > 0n
  ) {
    return null;
  }
  if (market.native && wallet.bnb > 0n) {
    return null;
  }
  if (
    market.underlying.toLowerCase() === WBNB.toLowerCase() &&
    wallet.wbnb > 0n
  ) {
    return null;
  }

  const candidates: { token: Address; balance: bigint; payNative?: boolean }[] =
    [
      { token: USDT, balance: wallet.usdt },
      { token: USDC, balance: wallet.usdc },
      { token: WBNB, balance: wallet.wbnb },
    ];
  if (!market.native && wallet.bnb > 0n) {
    candidates.push({ token: WBNB, balance: wallet.bnb, payNative: true });
  }
  return candidates.find((c) => c.balance > 0n) ?? null;
}

export function targetIsVbnb(market: CorePoolMarketQuote): boolean {
  return market.vToken.toLowerCase() === VBNB.toLowerCase();
}
