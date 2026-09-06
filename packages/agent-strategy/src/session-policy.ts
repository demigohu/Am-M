import { BNB_TESTNET, type Session } from "@altananetwork/sdk";
import { formatUnits, keccak256, type Address, type Hex } from "viem";
import {
  COMPTROLLER,
  USDC,
  USDT,
  VENUS_SWAP_ROUTER,
  WBNB,
} from "./addresses.js";
import { publicClient } from "./rpc.js";

const KEYSTORE_ABI = [
  {
    name: "isValidKey",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "keyId", type: "bytes32" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const SIG_LABEL: Record<string, string> = {
  "mint(uint256)": "mint",
  "mint()": "mintNative",
  "redeem(uint256)": "redeem",
  "redeemUnderlying(uint256)": "redeemUnderlying",
  "enterMarkets(address[])": "enterMarkets",
  "swapExactTokensForTokensAndSupply(address,uint256,uint256,address[],address,uint256)":
    "swapAndSupply",
  "swapExactTokensForBNBAndSupply(address,uint256,uint256,address[],address,uint256)":
    "swapBnbAndSupply",
  "swapExactETHForTokensAndSupply(address,uint256,address[],address,uint256)":
    "swapNativeAndSupply",
};

const TOKEN_SYMBOL: Record<string, string> = {
  [USDT.toLowerCase()]: "USDT",
  [USDC.toLowerCase()]: "USDC",
  [WBNB.toLowerCase()]: "WBNB",
};

const STABLE_DECIMALS = 6;
const DEFAULT_DECIMALS = 18;

export type SessionPolicyView = {
  wallet: Address;
  publicKey: Hex;
  keyId: Hex;
  expiry: number;
  expiresAt: string;
  expired: boolean;
  /** On-chain Keystore validity (false when revoked or expired). */
  validOnChain: boolean | null;
  spend: Array<{
    kind: "erc20" | "native";
    token?: Address;
    symbol: string;
    limit: string;
    limitHuman: string;
    period: string;
  }>;
  allowlist: {
    totalCalls: number;
    comptroller: string[];
    venusSwapRouter: string[];
    vTokenCount: number;
    vTokenSignatures: string[];
  };
  revoke: {
    hint: string;
    altanaKeyUrl: string;
  };
};

function tokenSymbol(token?: Address): string {
  if (!token) return "native";
  return TOKEN_SYMBOL[token.toLowerCase()] ?? token;
}

function tokenDecimals(symbol: string): number {
  return symbol === "USDT" || symbol === "USDC" ? STABLE_DECIMALS : DEFAULT_DECIMALS;
}

function formatLimitHuman(symbol: string, limit: bigint): string {
  const dec = tokenDecimals(symbol);
  const n = formatUnits(limit, dec);
  const trimmed = n.includes(".") ? n.replace(/\.?0+$/, "") : n;
  return `${trimmed} ${symbol}`;
}

export function sessionKeyId(session: Session): Hex {
  return keccak256(session.publicKey);
}

export function getSpendLimit(
  session: Session,
  opts: { token?: Address; native?: boolean },
): bigint | null {
  const spend = session.permissions.spend ?? [];
  if (opts.native) {
    const row = spend.find((s) => !s.token);
    return row?.limit ?? null;
  }
  if (!opts.token) return null;
  const want = opts.token.toLowerCase();
  const row = spend.find((s) => s.token?.toLowerCase() === want);
  return row?.limit ?? null;
}

/** Clip a planned spend to the session daily cap (when configured). */
export function clipToSessionSpend(
  session: Session | undefined,
  amount: bigint,
  opts: { token?: Address; native?: boolean },
): bigint {
  if (!session || amount === 0n) return amount;
  const cap = getSpendLimit(session, opts);
  if (cap === null) return amount;
  return cap < amount ? cap : amount;
}

function summarizeAllowlist(session: Session): SessionPolicyView["allowlist"] {
  const calls = session.permissions.calls ?? [];
  const comptroller = new Set<string>();
  const venusSwapRouter = new Set<string>();
  const vTokens = new Set<string>();
  const vTokenSignatures = new Set<string>();

  for (const call of calls) {
    if (!("to" in call) || !("signature" in call)) continue;
    const label = SIG_LABEL[call.signature] ?? call.signature;
    const to = call.to.toLowerCase();
    if (to === COMPTROLLER.toLowerCase()) {
      comptroller.add(label);
      continue;
    }
    if (to === VENUS_SWAP_ROUTER.toLowerCase()) {
      venusSwapRouter.add(label);
      continue;
    }
    vTokens.add(call.to);
    vTokenSignatures.add(label);
  }

  return {
    totalCalls: calls.length,
    comptroller: [...comptroller],
    venusSwapRouter: [...venusSwapRouter],
    vTokenCount: vTokens.size,
    vTokenSignatures: [...vTokenSignatures],
  };
}

function summarizeSpend(session: Session): SessionPolicyView["spend"] {
  return (session.permissions.spend ?? []).map((row) => {
    const symbol = tokenSymbol(row.token);
    const kind = row.token ? ("erc20" as const) : ("native" as const);
    const limit = row.limit;
    return {
      kind,
      token: row.token,
      symbol,
      limit: limit.toString(),
      limitHuman: formatLimitHuman(symbol, limit),
      period: row.period,
    };
  });
}

export async function summarizeSessionPolicy(
  session: Session,
  opts: { checkOnChain?: boolean } = {},
): Promise<SessionPolicyView> {
  const now = Math.floor(Date.now() / 1000);
  const keyId = sessionKeyId(session);
  const expired = session.expiry <= now;
  let validOnChain: boolean | null = null;

  if (opts.checkOnChain !== false) {
    try {
      validOnChain = await publicClient.readContract({
        address: BNB_TESTNET.keyStore,
        abi: KEYSTORE_ABI,
        functionName: "isValidKey",
        args: [session.walletAddress, keyId],
      });
    } catch {
      validOnChain = null;
    }
  }

  const altanaBase =
    process.env.ALTANA_EXPLORER_URL ?? "https://testnet.altana.network";

  return {
    wallet: session.walletAddress,
    publicKey: session.publicKey,
    keyId,
    expiry: session.expiry,
    expiresAt: new Date(session.expiry * 1000).toISOString(),
    expired,
    validOnChain,
    spend: summarizeSpend(session),
    allowlist: summarizeAllowlist(session),
    revoke: {
      hint:
        "Revoke this agent session from your Altana wallet (passkey). The agent cannot revoke itself.",
      altanaKeyUrl: `${altanaBase}/key/${keyId}`,
    },
  };
}

export async function loadSessionPolicies(
  sessions: Session[],
): Promise<SessionPolicyView[]> {
  return Promise.all(sessions.map((s) => summarizeSessionPolicy(s)));
}
