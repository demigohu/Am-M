"use client";

import { encodeFunctionData, formatUnits, type Address } from "viem";
import {
  PCS_NFPM,
  type RelayCall,
  VBNB,
  VUSDC,
  VUSDT,
} from "./chain";
import { publicClient } from "./rpc";

const VTOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "redeem",
    stateMutability: "nonpayable",
    inputs: [{ name: "redeemTokens", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const NFPM_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "positions",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "nonce", type: "uint96" },
      { name: "operator", type: "address" },
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickLower", type: "int24" },
      { name: "tickUpper", type: "int24" },
      { name: "liquidity", type: "uint128" },
      { name: "feeGrowthInside0LastX128", type: "uint256" },
      { name: "feeGrowthInside1LastX128", type: "uint256" },
      { name: "tokensOwed0", type: "uint128" },
      { name: "tokensOwed1", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "decreaseLiquidity",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "liquidity", type: "uint128" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "collect",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "amount0Max", type: "uint128" },
          { name: "amount1Max", type: "uint128" },
        ],
      },
    ],
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "payable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
] as const;

const VENUS_MARKETS = [
  { vToken: VUSDT, symbol: "vUSDT" },
  { vToken: VUSDC, symbol: "vUSDC" },
  { vToken: VBNB, symbol: "vBNB" },
] as const;

export type VenusPosition = {
  kind: "venus";
  vToken: Address;
  symbol: string;
  vTokenBalance: bigint;
  label: string;
};

export type LpPosition = {
  kind: "lp";
  tokenId: bigint;
  liquidity: bigint;
  tickLower: number;
  tickUpper: number;
  label: string;
};

export type OpenPosition = VenusPosition | LpPosition;

function tokenLabel(value: bigint): string {
  const n = Number(formatUnits(value, 18));
  if (!Number.isFinite(n) || n === 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

async function readVenusPositions(owner: Address): Promise<VenusPosition[]> {
  const out: VenusPosition[] = [];
  for (const row of VENUS_MARKETS) {
    const vTokenBalance = await publicClient.readContract({
      address: row.vToken,
      abi: VTOKEN_ABI,
      functionName: "balanceOf",
      args: [owner],
    });
    if (vTokenBalance === 0n) continue;
    out.push({
      kind: "venus",
      vToken: row.vToken,
      symbol: row.symbol,
      vTokenBalance,
      label: `${row.symbol} · ${tokenLabel(vTokenBalance)} supplied`,
    });
  }
  return out;
}

async function readLpPositions(owner: Address): Promise<LpPosition[]> {
  const count = await publicClient.readContract({
    address: PCS_NFPM,
    abi: NFPM_ABI,
    functionName: "balanceOf",
    args: [owner],
  });
  const out: LpPosition[] = [];
  for (let i = 0n; i < count; i++) {
    const tokenId = await publicClient.readContract({
      address: PCS_NFPM,
      abi: NFPM_ABI,
      functionName: "tokenOfOwnerByIndex",
      args: [owner, i],
    });
    const pos = await publicClient.readContract({
      address: PCS_NFPM,
      abi: NFPM_ABI,
      functionName: "positions",
      args: [tokenId],
    });
    const liquidity = pos[7];
    if (liquidity === 0n) continue;
    const tickLower = Number(pos[5]);
    const tickUpper = Number(pos[6]);
    out.push({
      kind: "lp",
      tokenId,
      liquidity,
      tickLower,
      tickUpper,
      label: `PCS LP #${tokenId.toString()} · ticks ${tickLower}–${tickUpper}`,
    });
  }
  return out;
}

export async function readOpenPositions(owner: Address): Promise<OpenPosition[]> {
  const [venus, lp] = await Promise.all([readVenusPositions(owner), readLpPositions(owner)]);
  return [...venus, ...lp];
}

export function encodeCloseLpPosition(owner: Address, position: LpPosition): RelayCall[] {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  const max128 = (1n << 128n) - 1n;
  return [
    {
      to: PCS_NFPM,
      data: encodeFunctionData({
        abi: NFPM_ABI,
        functionName: "decreaseLiquidity",
        args: [
          {
            tokenId: position.tokenId,
            liquidity: position.liquidity,
            amount0Min: 0n,
            amount1Min: 0n,
            deadline,
          },
        ],
      }),
    },
    {
      to: PCS_NFPM,
      data: encodeFunctionData({
        abi: NFPM_ABI,
        functionName: "collect",
        args: [
          {
            tokenId: position.tokenId,
            recipient: owner,
            amount0Max: max128,
            amount1Max: max128,
          },
        ],
      }),
    },
    {
      to: PCS_NFPM,
      data: encodeFunctionData({
        abi: NFPM_ABI,
        functionName: "burn",
        args: [position.tokenId],
      }),
    },
  ];
}

export function encodeRedeemVenus(position: VenusPosition): RelayCall {
  return {
    to: position.vToken,
    data: encodeFunctionData({
      abi: VTOKEN_ABI,
      functionName: "redeem",
      args: [position.vTokenBalance],
    }),
  };
}

export function buildWithdrawCalls(owner: Address, positions: OpenPosition[]): RelayCall[] {
  const calls: RelayCall[] = [];
  for (const pos of positions) {
    if (pos.kind === "venus") {
      calls.push(encodeRedeemVenus(pos));
    } else {
      calls.push(...encodeCloseLpPosition(owner, pos));
    }
  }
  return calls;
}
