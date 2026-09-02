import { encodeFunctionData, maxUint128 } from "viem";
import {
  PCS_FEE_WBNB_USDT,
  PCS_NFPM,
  PCS_POOL_WBNB_USDT,
  PCS_SWAP_ROUTER,
  USDT,
  WBNB,
  type Address,
} from "./addresses.js";
import { ERC20_ABI, NFPM_ABI, POOL_ABI, SWAP_ROUTER_ABI } from "./abi.js";
import { publicClient } from "./rpc.js";
import { min, type RiskProfile, type StrategyCall } from "./types.js";

export type PoolSnap = {
  tick: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  token0: Address;
  token1: Address;
  fee: number;
};

export type LpPosition = {
  tokenId: bigint;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  inRange: boolean;
};

export async function readPool(): Promise<PoolSnap> {
  const [slot0, token0, token1, fee, liquidity, tickSpacing] = await Promise.all([
    publicClient.readContract({
      address: PCS_POOL_WBNB_USDT,
      abi: POOL_ABI,
      functionName: "slot0",
    }),
    publicClient.readContract({
      address: PCS_POOL_WBNB_USDT,
      abi: POOL_ABI,
      functionName: "token0",
    }),
    publicClient.readContract({
      address: PCS_POOL_WBNB_USDT,
      abi: POOL_ABI,
      functionName: "token1",
    }),
    publicClient.readContract({
      address: PCS_POOL_WBNB_USDT,
      abi: POOL_ABI,
      functionName: "fee",
    }),
    publicClient.readContract({
      address: PCS_POOL_WBNB_USDT,
      abi: POOL_ABI,
      functionName: "liquidity",
    }),
    publicClient.readContract({
      address: PCS_POOL_WBNB_USDT,
      abi: POOL_ABI,
      functionName: "tickSpacing",
    }),
  ]);
  return {
    tick: Number(slot0[1]),
    tickSpacing: Number(tickSpacing),
    sqrtPriceX96: slot0[0],
    liquidity,
    token0,
    token1,
    fee: Number(fee),
  };
}

export async function readLpPositions(owner: Address): Promise<LpPosition[]> {
  const pool = await readPool();
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
    const tickLower = Number(pos[5]);
    const tickUpper = Number(pos[6]);
    const liquidity = pos[7];
    if (pos[2].toLowerCase() !== pool.token0.toLowerCase()) continue;
    if (pos[3].toLowerCase() !== pool.token1.toLowerCase()) continue;
    if (Number(pos[4]) !== pool.fee) continue;
    out.push({
      tokenId,
      tickLower,
      tickUpper,
      liquidity,
      inRange: pool.tick >= tickLower && pool.tick < tickUpper,
    });
  }
  return out;
}

export async function tokenBalances(owner: Address): Promise<{
  wbnb: bigint;
  usdt: bigint;
}> {
  const [wbnb, usdt] = await Promise.all([
    publicClient.readContract({
      address: WBNB,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner],
    }),
    publicClient.readContract({
      address: USDT,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner],
    }),
  ]);
  return { wbnb, usdt };
}

function alignTick(tick: number, spacing: number, mode: "down" | "up"): number {
  const s = spacing === 0 ? 1 : spacing;
  if (mode === "down") return Math.floor(tick / s) * s;
  return Math.ceil(tick / s) * s;
}

export function rangeWidth(variant: RiskProfile): number {
  return variant === "aggressive" ? 60 : 200;
}

export function encodeMintRange(opts: {
  owner: Address;
  pool: PoolSnap;
  width: number;
  amount0: bigint;
  amount1: bigint;
}): StrategyCall {
  const lower = alignTick(opts.pool.tick - opts.width, opts.pool.tickSpacing, "down");
  let upper = alignTick(opts.pool.tick + opts.width, opts.pool.tickSpacing, "up");
  if (upper <= lower) upper = lower + opts.pool.tickSpacing;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  return {
    to: PCS_NFPM,
    data: encodeFunctionData({
      abi: NFPM_ABI,
      functionName: "mint",
      args: [
        {
          token0: opts.pool.token0,
          token1: opts.pool.token1,
          fee: opts.pool.fee,
          tickLower: lower,
          tickUpper: upper,
          amount0Desired: opts.amount0,
          amount1Desired: opts.amount1,
          amount0Min: 0n,
          amount1Min: 0n,
          recipient: opts.owner,
          deadline,
        },
      ],
    }),
  };
}

export function encodeRebalanceOutOfRange(opts: {
  owner: Address;
  tokenId: bigint;
  liquidity: bigint;
  pool: PoolSnap;
  width: number;
  amount0: bigint;
  amount1: bigint;
}): StrategyCall[] {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  const decrease: StrategyCall = {
    to: PCS_NFPM,
    data: encodeFunctionData({
      abi: NFPM_ABI,
      functionName: "decreaseLiquidity",
      args: [
        {
          tokenId: opts.tokenId,
          liquidity: opts.liquidity,
          amount0Min: 0n,
          amount1Min: 0n,
          deadline,
        },
      ],
    }),
  };
  const collect: StrategyCall = {
    to: PCS_NFPM,
    data: encodeFunctionData({
      abi: NFPM_ABI,
      functionName: "collect",
      args: [
        {
          tokenId: opts.tokenId,
          recipient: opts.owner,
          amount0Max: maxUint128,
          amount1Max: maxUint128,
        },
      ],
    }),
  };
  const burn: StrategyCall = {
    to: PCS_NFPM,
    data: encodeFunctionData({
      abi: NFPM_ABI,
      functionName: "burn",
      args: [opts.tokenId],
    }),
  };
  return [
    decrease,
    collect,
    burn,
    encodeMintRange({
      owner: opts.owner,
      pool: opts.pool,
      width: opts.width,
      amount0: opts.amount0,
      amount1: opts.amount1,
    }),
  ];
}

export function encodeExactInputSingle(opts: {
  owner: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
}): StrategyCall {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  return {
    to: PCS_SWAP_ROUTER,
    data: encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: opts.tokenIn,
          tokenOut: opts.tokenOut,
          fee: PCS_FEE_WBNB_USDT,
          recipient: opts.owner,
          deadline,
          amountIn: opts.amountIn,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n,
        },
      ],
    }),
  };
}

export function gridLevelCount(variant: RiskProfile): number {
  return variant === "aggressive" ? 9 : 5;
}

export function gridSpacingBps(variant: RiskProfile): number {
  return variant === "aggressive" ? 80 : 200;
}

export function clipSwapSize(variant: RiskProfile, available: bigint): bigint {
  if (available === 0n) return 0n;
  const frac = variant === "aggressive" ? 5n : 10n;
  return min(available / frac === 0n ? available : available / frac, available);
}
