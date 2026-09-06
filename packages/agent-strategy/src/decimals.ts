import { USDC, USDT, WBNB, type Address } from "./addresses.js";

/** Venus testnet USDT/USDC use 6 decimals. */
export const STABLE_DECIMALS = 6;
/** WBNB / native BNB use 18 decimals. */
export const TOKEN_DECIMALS = 18;

/** Default per-tick stable size — 10 USDT (not 10^16 raw). */
export const DEFAULT_STABLE_NOTIONAL = 10n * 10n ** BigInt(STABLE_DECIMALS);
/** Default per-tick WBNB size — 0.01 WBNB. */
export const DEFAULT_WBNB_NOTIONAL = 10n ** 15n;
/** Default daily stable spend cap when user does not customize (100 USDT). */
export const DEFAULT_STABLE_SPEND_CAP = 100n * 10n ** BigInt(STABLE_DECIMALS);
/** Default daily WBNB spend cap (100 WBNB). */
export const DEFAULT_WBNB_SPEND_CAP = 100n * 10n ** 18n;
/** Default daily native cap — 0.1 BNB. */
export const DEFAULT_NATIVE_SPEND_CAP = 10n ** 17n;

export function isStableToken(token: Address): boolean {
  const lower = token.toLowerCase();
  return lower === USDT.toLowerCase() || lower === USDC.toLowerCase();
}

export function isWbnbToken(token: Address): boolean {
  return token.toLowerCase() === WBNB.toLowerCase();
}

export function defaultNotionalForToken(token: Address): bigint {
  return isStableToken(token) ? DEFAULT_STABLE_NOTIONAL : DEFAULT_WBNB_NOTIONAL;
}

export function formatStableCapHuman(raw: bigint): string {
  const whole = raw / 10n ** BigInt(STABLE_DECIMALS);
  return `${whole.toString()} USDT/USDC`;
}

export function formatWbnbCapHuman(raw: bigint): string {
  const whole = raw / 10n ** 18n;
  return `${whole.toString()} WBNB`;
}

export function formatNativeCapHuman(raw: bigint): string {
  const whole = raw / 10n ** 18n;
  const frac = raw % 10n ** 18n;
  if (frac === 0n) return `${whole.toString()} BNB`;
  return `${whole}.${frac.toString().padStart(18, "0").replace(/0+$/, "")} BNB`;
}
