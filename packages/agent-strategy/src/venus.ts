import { encodeFunctionData } from "viem";
import {
  COMPTROLLER,
  VBNB,
  VTOKENS,
  type Address,
} from "./addresses.js";
import {
  COMPTROLLER_ABI,
  ERC20_ABI,
  ORACLE_ABI,
  VTOKEN_ABI,
} from "./abi.js";
import { publicClient } from "./rpc.js";
import { min, type RiskProfile, type StrategyCall } from "./types.js";

const BLOCKS_PER_YEAR = 10_512_000n; // BSC ~3s blocks

export type VenusMarketSnap = {
  vToken: Address;
  symbol: string;
  native: boolean;
  underlying: Address;
  vTokenBalance: bigint;
  underlyingSupplied: bigint;
  borrowStored: bigint;
  walletUnderlying: bigint;
  supplyRatePerBlock: bigint;
  supplyAprApprox: number;
};

export type VenusAccount = {
  error: bigint;
  liquidity: bigint;
  shortfall: bigint;
  healthFactor: number | null;
  inMarkets: Address[];
  markets: VenusMarketSnap[];
};

function aprFromRatePerBlock(rate: bigint): number {
  return Number(rate * BLOCKS_PER_YEAR) / 1e18;
}

function hfFromParts(
  borrowUsd: bigint,
  liquidity: bigint,
  shortfall: bigint,
): number | null {
  if (borrowUsd === 0n) return null;
  const collateral =
    shortfall > 0n ? borrowUsd - min(borrowUsd, shortfall) : borrowUsd + liquidity;
  const num = Number(collateral);
  const den = Number(borrowUsd);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
  return num / den;
}

export async function readVenusAccount(owner: Address): Promise<VenusAccount> {
  const [error, liquidity, shortfall] = await publicClient.readContract({
    address: COMPTROLLER,
    abi: COMPTROLLER_ABI,
    functionName: "getAccountLiquidity",
    args: [owner],
  });
  const inMarkets = (await publicClient.readContract({
    address: COMPTROLLER,
    abi: COMPTROLLER_ABI,
    functionName: "getAssetsIn",
    args: [owner],
  })) as Address[];
  const oracle = (await publicClient.readContract({
    address: COMPTROLLER,
    abi: COMPTROLLER_ABI,
    functionName: "oracle",
  })) as Address;

  const markets: VenusMarketSnap[] = [];
  let borrowUsd = 0n;
  for (const row of VTOKENS) {
    const [vBal, rate, borrow, walletBal, exRate, price] = await Promise.all([
      publicClient.readContract({
        address: row.vToken,
        abi: VTOKEN_ABI,
        functionName: "balanceOf",
        args: [owner],
      }),
      publicClient.readContract({
        address: row.vToken,
        abi: VTOKEN_ABI,
        functionName: "supplyRatePerBlock",
      }),
      publicClient.readContract({
        address: row.vToken,
        abi: VTOKEN_ABI,
        functionName: "borrowBalanceStored",
        args: [owner],
      }),
      row.native
        ? publicClient.getBalance({ address: owner })
        : publicClient.readContract({
            address: row.underlying,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [owner],
          }),
      publicClient.readContract({
        address: row.vToken,
        abi: VTOKEN_ABI,
        functionName: "exchangeRateStored",
      }),
      publicClient.readContract({
        address: oracle,
        abi: ORACLE_ABI,
        functionName: "getUnderlyingPrice",
        args: [row.vToken],
      }),
    ]);
    const underlyingSupplied = (vBal * exRate) / 10n ** 18n;
    borrowUsd += (borrow * price) / 10n ** 18n;
    markets.push({
      vToken: row.vToken,
      symbol: row.symbol,
      native: row.native,
      underlying: row.underlying,
      vTokenBalance: vBal,
      underlyingSupplied,
      borrowStored: borrow,
      walletUnderlying: walletBal,
      supplyRatePerBlock: rate,
      supplyAprApprox: aprFromRatePerBlock(rate),
    });
  }

  return {
    error,
    liquidity,
    shortfall,
    healthFactor: hfFromParts(borrowUsd, liquidity, shortfall),
    inMarkets,
    markets,
  };
}

const MINT_ERC20 = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [{ name: "mintAmount", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const;
const MINT_BNB = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;
const REPAY_ERC20 = [
  {
    type: "function",
    name: "repayBorrow",
    stateMutability: "nonpayable",
    inputs: [{ name: "repayAmount", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const;
const REPAY_BNB = [
  {
    type: "function",
    name: "repayBorrow",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

export function encodeVenusMint(vToken: Address, amount: bigint): StrategyCall {
  if (vToken.toLowerCase() === VBNB.toLowerCase()) {
    return {
      to: vToken,
      value: amount,
      data: encodeFunctionData({ abi: MINT_BNB, functionName: "mint" }),
    };
  }
  return {
    to: vToken,
    data: encodeFunctionData({
      abi: MINT_ERC20,
      functionName: "mint",
      args: [amount],
    }),
  };
}

export function encodeVenusRedeem(
  vToken: Address,
  vTokenAmount: bigint,
): StrategyCall {
  return {
    to: vToken,
    data: encodeFunctionData({
      abi: VTOKEN_ABI,
      functionName: "redeem",
      args: [vTokenAmount],
    }),
  };
}

export function encodeVenusRedeemUnderlying(
  vToken: Address,
  underlyingAmount: bigint,
): StrategyCall {
  return {
    to: vToken,
    data: encodeFunctionData({
      abi: VTOKEN_ABI,
      functionName: "redeemUnderlying",
      args: [underlyingAmount],
    }),
  };
}

export function encodeVenusRepay(vToken: Address, amount: bigint): StrategyCall {
  if (vToken.toLowerCase() === VBNB.toLowerCase()) {
    return {
      to: vToken,
      value: amount,
      data: encodeFunctionData({
        abi: REPAY_BNB,
        functionName: "repayBorrow",
      }),
    };
  }
  return {
    to: vToken,
    data: encodeFunctionData({
      abi: REPAY_ERC20,
      functionName: "repayBorrow",
      args: [amount],
    }),
  };
}

export function hfThreshold(variant: RiskProfile): number {
  return variant === "aggressive" ? 1.2 : 1.5;
}

export function maxSaveWei(variant: RiskProfile, notional: bigint): bigint {
  return variant === "aggressive" ? notional : notional / 5n;
}
