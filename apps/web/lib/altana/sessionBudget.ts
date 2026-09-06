import { STABLE_DECIMALS } from "./chain";

export const SPEND_CAP_PRESETS = [100, 500, 1000] as const;
export const LEASE_PRESETS = [7, 14, 30] as const;
export const DEFAULT_SPEND_CAP_STABLE = 100;
export const DEFAULT_LEASE_DAYS = 30;
export const DEFAULT_NATIVE_CAP_BNB = "0.1";

export type SessionBudgetInput = {
  stableDailyCap: number;
  leaseDays: number;
};

export type SessionBudgetLimits = {
  stableDailyCap: string;
  wbnbDailyCap: string;
  nativeDailyCap: string;
  leaseDays: number;
};

export function stableCapToRaw(amount: number): bigint {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Spend cap must be a positive number.");
  }
  return BigInt(Math.floor(amount)) * 10n ** BigInt(STABLE_DECIMALS);
}

export function wbnbCapFromStableAmount(amount: number): bigint {
  return BigInt(Math.floor(amount)) * 10n ** 18n;
}

export function nativeCapRaw(): bigint {
  return 10n ** 17n;
}

export function buildSessionBudget(input: SessionBudgetInput): SessionBudgetLimits {
  const stable = stableCapToRaw(input.stableDailyCap);
  const wbnb = wbnbCapFromStableAmount(input.stableDailyCap);
  const native = nativeCapRaw();
  return {
    stableDailyCap: stable.toString(),
    wbnbDailyCap: wbnb.toString(),
    nativeDailyCap: native.toString(),
    leaseDays: input.leaseDays,
  };
}

export function sessionBudgetToGrantOpts(budget: SessionBudgetLimits) {
  return {
    stableDailyCap: BigInt(budget.stableDailyCap),
    wbnbDailyCap: BigInt(budget.wbnbDailyCap),
    nativeDailyCap: BigInt(budget.nativeDailyCap),
  };
}

export function formatStableCapLabel(amount: number): string {
  return `${amount} USDT/USDC per day`;
}

export function formatLeaseLabel(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function formatSessionBudgetSummary(budget: SessionBudgetLimits): {
  spendLabel: string;
  nativeLabel: string;
  leaseLabel: string;
} {
  const stableWhole = BigInt(budget.stableDailyCap) / 10n ** BigInt(STABLE_DECIMALS);
  const wbnbWhole = BigInt(budget.wbnbDailyCap) / 10n ** 18n;
  return {
    spendLabel: `${stableWhole.toString()} USDT/USDC + ${wbnbWhole.toString()} WBNB per day`,
    nativeLabel: `${DEFAULT_NATIVE_CAP_BNB} tBNB per day`,
    leaseLabel: formatLeaseLabel(budget.leaseDays),
  };
}

export function budgetFromHire(hire: { sessionBudget?: SessionBudgetLimits }): SessionBudgetLimits {
  if (hire.sessionBudget) return hire.sessionBudget;
  return buildSessionBudget({
    stableDailyCap: DEFAULT_SPEND_CAP_STABLE,
    leaseDays: DEFAULT_LEASE_DAYS,
  });
}

export function defaultSessionBudgetInput(): SessionBudgetInput {
  return {
    stableDailyCap: DEFAULT_SPEND_CAP_STABLE,
    leaseDays: DEFAULT_LEASE_DAYS,
  };
}
