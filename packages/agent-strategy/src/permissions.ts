import type { SessionPermissions } from "@altananetwork/sdk";
import {
  COMPTROLLER,
  PCS_NFPM,
  PCS_SWAP_ROUTER,
  SIG,
  USDC,
  USDT,
  VBNB,
  VUSDC,
  VUSDT,
  WBNB,
} from "./addresses.js";

/** Daily USDT/USDC cap for a test hire (18 decimals on BSC). */
export const TEST_TOKEN_SPEND_LIMIT = 100n * 10n ** 18n;
/** Daily native cap for vBNB mint / relay value. */
export const TEST_NATIVE_SPEND_LIMIT = 10n ** 17n;

/**
 * Guard (healthfactor) session allowlist — mint/repay/redeem on Venus
 * testnet vTokens. Approve stays on the admin path (script or passkey).
 */
export function guardSessionPermissions(
  spendLimit: bigint = TEST_TOKEN_SPEND_LIMIT,
): SessionPermissions {
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
      { limit: TEST_NATIVE_SPEND_LIMIT, period: "day" },
    ],
  };
}

/**
 * Rebalance session — PCS V3 NFPM only. Token approve stays admin-path.
 */
export function rebalanceSessionPermissions(
  spendLimit: bigint = TEST_TOKEN_SPEND_LIMIT,
): SessionPermissions {
  return {
    calls: [
      { to: PCS_NFPM, signature: SIG.pcsMint },
      { to: PCS_NFPM, signature: SIG.pcsIncrease },
      { to: PCS_NFPM, signature: SIG.pcsDecrease },
      { to: PCS_NFPM, signature: SIG.pcsCollect },
      { to: PCS_NFPM, signature: SIG.pcsBurn },
    ],
    spend: [
      { token: USDT, limit: spendLimit, period: "day" },
      { token: WBNB, limit: spendLimit, period: "day" },
      { limit: TEST_NATIVE_SPEND_LIMIT, period: "day" },
    ],
  };
}

/**
 * Yield session — Venus mint/redeem only (no repay). Token approve stays admin-path.
 */
export function yieldSessionPermissions(
  spendLimit: bigint = TEST_TOKEN_SPEND_LIMIT,
): SessionPermissions {
  return {
    calls: [
      { to: VUSDT, signature: SIG.venusMint },
      { to: VUSDC, signature: SIG.venusMint },
      { to: VBNB, signature: SIG.venusMintBnb },
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
      { limit: TEST_NATIVE_SPEND_LIMIT, period: "day" },
    ],
  };
}

/**
 * Grid session — SwapRouter exactInputSingle on the same pair.
 */
export function gridSessionPermissions(
  spendLimit: bigint = TEST_TOKEN_SPEND_LIMIT,
): SessionPermissions {
  return {
    calls: [{ to: PCS_SWAP_ROUTER, signature: SIG.pcsExactInputSingle }],
    spend: [
      { token: USDT, limit: spendLimit, period: "day" },
      { token: WBNB, limit: spendLimit, period: "day" },
      { limit: TEST_NATIVE_SPEND_LIMIT, period: "day" },
    ],
  };
}
