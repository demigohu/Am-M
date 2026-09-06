"use client";

import { formatEther, formatUnits, type Address } from "viem";
import { ERC20_ABI, MIN_NATIVE_WEI, STABLE_DECIMALS, TOKEN_U, TOKEN_U_DECIMALS, USDC, USDT } from "./chain";
import { publicClient } from "./rpc";

export type VaultBalances = {
  native: bigint;
  nativeLabel: string;
  usdt: bigint;
  usdtLabel: string;
  usdc: bigint;
  usdcLabel: string;
  u: bigint;
  uLabel: string;
  funded: boolean;
};

function tokenLabel(value: bigint, decimals: number): string {
  const n = Number(formatUnits(value, decimals));
  if (!Number.isFinite(n)) return value.toString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export async function readVault(address: Address): Promise<VaultBalances> {
  const [native, usdt, usdc, u] = await Promise.all([
    publicClient.getBalance({ address }),
    publicClient.readContract({
      address: USDT,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    }),
    publicClient.readContract({
      address: USDC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    }),
    publicClient
      .readContract({
        address: TOKEN_U,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      })
      .catch(() => 0n),
  ]);
  return {
    native,
    nativeLabel: Number(formatEther(native)).toFixed(4),
    usdt,
    usdtLabel: tokenLabel(usdt, STABLE_DECIMALS),
    usdc,
    usdcLabel: tokenLabel(usdc, STABLE_DECIMALS),
    u,
    uLabel: tokenLabel(u, TOKEN_U_DECIMALS),
    funded: native >= MIN_NATIVE_WEI,
  };
}
