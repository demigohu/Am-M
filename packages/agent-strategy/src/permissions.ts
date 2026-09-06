import type { SessionPermissions } from "@altananetwork/sdk";
import {
  COMPTROLLER,
  PCS_NFPM,
  PCS_SWAP_ROUTER,
  SIG,
  USDC,
  USDT,
  VBNB,
  VENUS_SWAP_ROUTER,
  VUSDC,
  VUSDT,
  WBNB,
} from "./addresses.js";
import { CORE_POOL_VTOKENS } from "./core-pool-vtokens.js";

import {
  DEFAULT_NATIVE_SPEND_CAP,
  DEFAULT_STABLE_SPEND_CAP,
  DEFAULT_WBNB_SPEND_CAP,
} from "./decimals.js";

/** Daily USDT/USDC cap for a test hire (6 decimals on Venus testnet stables). */
export const TEST_STABLE_SPEND_LIMIT = DEFAULT_STABLE_SPEND_CAP;
/** Daily generic 18-decimal token cap. */
export const TEST_TOKEN_SPEND_LIMIT = DEFAULT_WBNB_SPEND_CAP;
/** Daily native cap for vBNB mint / relay value. */
export const TEST_NATIVE_SPEND_LIMIT = DEFAULT_NATIVE_SPEND_CAP;

export type SessionBudgetOpts = {
  stableDailyCap?: bigint;
  wbnbDailyCap?: bigint;
  nativeDailyCap?: bigint;
};

function resolveBudget(opts?: SessionBudgetOpts) {
  return {
    stable: opts?.stableDailyCap ?? TEST_STABLE_SPEND_LIMIT,
    wbnb: opts?.wbnbDailyCap ?? TEST_TOKEN_SPEND_LIMIT,
    native: opts?.nativeDailyCap ?? TEST_NATIVE_SPEND_LIMIT,
  };
}

function corePoolVenusCalls() {
  const calls: NonNullable<SessionPermissions["calls"]>[number][] = [
    { to: COMPTROLLER, signature: SIG.venusEnterMarkets },
    { to: VENUS_SWAP_ROUTER, signature: SIG.venusSwapExactTokensForTokensAndSupply },
    { to: VENUS_SWAP_ROUTER, signature: SIG.venusSwapExactTokensForBNBAndSupply },
    { to: VENUS_SWAP_ROUTER, signature: SIG.venusSwapExactETHForTokensAndSupply },
  ];
  for (const vToken of CORE_POOL_VTOKENS) {
    calls.push({ to: vToken, signature: SIG.venusMint });
    if (vToken.toLowerCase() === VBNB.toLowerCase()) {
      calls.push({ to: vToken, signature: SIG.venusMintBnb });
    }
    calls.push({ to: vToken, signature: SIG.venusRedeem });
    calls.push({ to: vToken, signature: SIG.venusRedeemUnderlying });
  }
  return calls;
}

/**
 * Guard (healthfactor) session allowlist — mint/repay/redeem on Venus
 * testnet vTokens. Approve stays on the admin path (script or passkey).
 */
export function guardSessionPermissions(
  opts?: SessionBudgetOpts | bigint,
): SessionPermissions {
  const spendLimit =
    typeof opts === "bigint" ? opts : resolveBudget(opts).stable;
  const { native } =
    typeof opts === "bigint" ? { native: TEST_NATIVE_SPEND_LIMIT } : resolveBudget(opts);
  return {
    calls: [
      { to: VUSDT, signature: SIG.venusMint },
      { to: VUSDC, signature: SIG.venusMint },
      { to: VBNB, signature: SIG.venusMintBnb },
      { to: VUSDT, signature: SIG.venusRepay },
      { to: VUSDC, signature: SIG.venusRepay },
      { to: VBNB, signature: SIG.venusRepayBnb },
      { to: VUSDT, signature: SIG.venusRedeem },
      { to: VUSDC, signature: SIG.venusRedeem },
      { to: VBNB, signature: SIG.venusRedeem },
      { to: VUSDT, signature: SIG.venusRedeemUnderlying },
      { to: VUSDC, signature: SIG.venusRedeemUnderlying },
      { to: VBNB, signature: SIG.venusRedeemUnderlying },
      { to: COMPTROLLER, signature: SIG.venusEnterMarkets },
    ],
    spend: [
      { token: USDT, limit: spendLimit, period: "day" },
      { token: USDC, limit: spendLimit, period: "day" },
      { limit: native, period: "day" },
    ],
  };
}

/**
 * Rebalance session — PCS V3 NFPM only. Token approve stays admin-path.
 */
export function rebalanceSessionPermissions(
  opts?: SessionBudgetOpts | bigint,
): SessionPermissions {
  const budget =
    typeof opts === "bigint"
      ? { stable: opts, wbnb: TEST_TOKEN_SPEND_LIMIT, native: TEST_NATIVE_SPEND_LIMIT }
      : resolveBudget(opts);
  return {
    calls: [
      { to: PCS_NFPM, signature: SIG.pcsMint },
      { to: PCS_NFPM, signature: SIG.pcsIncrease },
      { to: PCS_NFPM, signature: SIG.pcsDecrease },
      { to: PCS_NFPM, signature: SIG.pcsCollect },
      { to: PCS_NFPM, signature: SIG.pcsBurn },
    ],
    spend: [
      { token: USDT, limit: budget.stable, period: "day" },
      { token: WBNB, limit: budget.wbnb, period: "day" },
      { limit: budget.native, period: "day" },
    ],
  };
}

/**
 * Yield session — Venus Core Pool mint/redeem + Venus SwapRouter rotate.
 */
export function yieldSessionPermissions(
  opts?: SessionBudgetOpts | bigint,
): SessionPermissions {
  const budget =
    typeof opts === "bigint"
      ? {
          stable: opts,
          wbnb: TEST_TOKEN_SPEND_LIMIT,
          native: TEST_NATIVE_SPEND_LIMIT,
        }
      : resolveBudget(opts);
  return {
    calls: corePoolVenusCalls(),
    spend: [
      { token: USDT, limit: budget.stable, period: "day" },
      { token: USDC, limit: budget.stable, period: "day" },
      { token: WBNB, limit: budget.wbnb, period: "day" },
      { limit: budget.native, period: "day" },
    ],
  };
}

/**
 * Grid session — SwapRouter exactInputSingle on the same pair.
 */
export function gridSessionPermissions(
  opts?: SessionBudgetOpts | bigint,
): SessionPermissions {
  const budget =
    typeof opts === "bigint"
      ? { stable: opts, wbnb: TEST_TOKEN_SPEND_LIMIT, native: TEST_NATIVE_SPEND_LIMIT }
      : resolveBudget(opts);
  return {
    calls: [{ to: PCS_SWAP_ROUTER, signature: SIG.pcsExactInputSingle }],
    spend: [
      { token: USDT, limit: budget.stable, period: "day" },
      { token: WBNB, limit: budget.wbnb, period: "day" },
      { limit: budget.native, period: "day" },
    ],
  };
}
