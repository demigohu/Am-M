/**
 * Yield desk session allowlist — mirrors packages/agent-strategy yieldSessionPermissions.
 *
 * Only vUSDT / vUSDC / vBNB here on purpose: full Core Pool (~46 vTokens) produces
 * ~150 Keystore calls and ~18M gas; Altana testnet relay then stays PENDING on grantSession.
 */
import type { SessionPermissions } from "@altananetwork/sdk";
import type { DeskSlug } from "../catalog";

export const VENUS_SWAP_ROUTER = "0xd3F226acA3210990DBA3f410b74E36b08F31FCf2" as const;

/** Keep in sync with packages/agent-strategy YIELD_SESSION_VTOKENS */
export const YIELD_SESSION_VTOKENS = [
  "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A", // vUSDT
  "0xD5C4C2e2facBEB59D0216D0595d63FcDc6F9A1a7", // vUSDC
  "0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c", // vBNB
] as const;

export function yieldPermissionsForDesk(
  sig: {
    venusMint: string;
    venusMintBnb: string;
    venusRedeem: string;
    venusRedeemUnderlying: string;
    venusEnterMarkets: string;
    venusSwapExactTokensForTokensAndSupply: string;
    venusSwapExactTokensForBNBAndSupply: string;
    venusSwapExactETHForTokensAndSupply: string;
  },
  comptroller: `0x${string}`,
  vBnb: `0x${string}`,
  spend: SessionPermissions["spend"],
): SessionPermissions {
  const calls: NonNullable<SessionPermissions["calls"]>[number][] = [
    { to: comptroller, signature: sig.venusEnterMarkets },
    { to: VENUS_SWAP_ROUTER, signature: sig.venusSwapExactTokensForTokensAndSupply },
    { to: VENUS_SWAP_ROUTER, signature: sig.venusSwapExactTokensForBNBAndSupply },
    { to: VENUS_SWAP_ROUTER, signature: sig.venusSwapExactETHForTokensAndSupply },
  ];
  for (const vToken of YIELD_SESSION_VTOKENS) {
    calls.push({ to: vToken, signature: sig.venusMint });
    if (vToken.toLowerCase() === vBnb.toLowerCase()) {
      calls.push({ to: vToken, signature: sig.venusMintBnb });
    }
    calls.push({ to: vToken, signature: sig.venusRedeem });
    calls.push({ to: vToken, signature: sig.venusRedeemUnderlying });
  }
  return { calls, spend };
}

export type { DeskSlug };
