import type { Session } from "@altananetwork/sdk";
import { USDC, USDT, WBNB, type Address } from "./addresses.js";
import { DEFAULT_WBNB_NOTIONAL, defaultNotionalForToken } from "./decimals.js";
import { clipToSessionSpend } from "./session-policy.js";
import { min } from "./types.js";

export type SpendTarget =
  | { kind: "erc20"; token: Address }
  | { kind: "native" };

export function spendTargetForToken(token: Address, native = false): SpendTarget {
  return native ? { kind: "native" } : { kind: "erc20", token };
}

/** Clip planned size to wallet balance, strategy notional, and session daily spend cap. */
export function clipPlanAmount(
  session: Session | undefined,
  walletBalance: bigint,
  target: SpendTarget,
  strategyNotional?: bigint,
): bigint {
  const notional =
    strategyNotional ??
    (target.kind === "erc20"
      ? defaultNotionalForToken(target.token)
      : DEFAULT_WBNB_NOTIONAL);
  let amount = min(walletBalance, notional);
  if (!session || amount === 0n) return amount;
  if (target.kind === "native") {
    return clipToSessionSpend(session, amount, { native: true });
  }
  return clipToSessionSpend(session, amount, { token: target.token });
}

export function spendCapBlockedReason(target: SpendTarget): string {
  if (target.kind === "native") {
    return "Blocked: daily session native spend cap reached. Revoke or re-hire with a higher cap.";
  }
  const lower = target.token.toLowerCase();
  const label =
    lower === USDT.toLowerCase()
      ? "USDT"
      : lower === USDC.toLowerCase()
        ? "USDC"
        : lower === WBNB.toLowerCase()
          ? "WBNB"
          : "token";
  return `Blocked: daily session spend cap reached for ${label}. Revoke or re-hire with a higher cap.`;
}
