import type { Address, Hex } from "viem";
import type { Session } from "@altananetwork/sdk";

export type RiskProfile = "conservative" | "aggressive";

export type StrategyCall = {
  to: Address;
  data?: Hex;
  value?: bigint;
};

export type ExecuteResultLike = {
  status: "PENDING" | "CONFIRMED" | "FAILED";
  transactionHash?: Hex;
  callsId?: Hex;
};

export type ExecuteFn = (
  session: Session,
  calls: readonly StrategyCall[],
  label: string,
) => Promise<ExecuteResultLike>;

export type TickAction =
  | { kind: "noop"; reason: string }
  | { kind: "blocked"; reason: string }
  | {
      kind: "execute";
      reason: string;
      label: string;
      calls: StrategyCall[];
    };

import type { SessionPolicyView } from "./session-policy.js";

export type TickReport = {
  desk: "healthfactor" | "yieldrouter" | "rebalancing" | "gridtrading";
  variant: RiskProfile;
  wallet: Address;
  at: string;
  snapshot: Record<string, unknown>;
  action: TickAction;
  execution?: ExecuteResultLike;
  /** User-visible session limits (allowlist, spend caps, expiry). No session private key. */
  sessionPolicy?: SessionPolicyView;
};

export function riskProfile(raw = process.env.AGENT_VARIANT): RiskProfile {
  return raw?.toLowerCase() === "aggressive" ? "aggressive" : "conservative";
}

export function defaultNotionalWei(): bigint {
  const raw = process.env.STRATEGY_NOTIONAL_WEI;
  if (raw && /^\d+$/.test(raw)) return BigInt(raw);
  return 10n * 10n ** 6n; // 10 USDT (6 decimals)
}

export function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export function jsonSafe(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}
