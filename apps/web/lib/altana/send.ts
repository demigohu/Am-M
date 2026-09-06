"use client";

import { encodeFunctionData, isAddress, parseEther, parseUnits, type Address } from "viem";
import { ERC20_ABI, MIN_NATIVE_WEI, TOKEN_U, USDC, USDT, type RelayCall } from "./chain";

export type SendAsset = "tBNB" | "USDT" | "USDC" | "U";

const TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const GAS_RESERVE = MIN_NATIVE_WEI;

export function sendAssetLabel(asset: SendAsset): string {
  if (asset === "tBNB") return "tBNB";
  if (asset === "U") return "$U";
  return asset;
}

export function parseSendAmount(asset: SendAsset, amount: string): bigint {
  const trimmed = amount.trim();
  if (!trimmed || Number(trimmed) <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }
  if (asset === "tBNB") return parseEther(trimmed);
  return parseUnits(trimmed, 18);
}

export function validateSendRecipient(to: string): Address {
  const trimmed = to.trim();
  if (!isAddress(trimmed)) {
    throw new Error("Enter a valid BSC address (0x…).");
  }
  return trimmed;
}

export function buildSendCall(asset: SendAsset, to: Address, amount: bigint): RelayCall {
  if (asset === "tBNB") {
    return { to, value: amount, data: "0x" };
  }
  const token = asset === "USDT" ? USDT : asset === "USDC" ? USDC : TOKEN_U;
  return {
    to: token,
    data: encodeFunctionData({
      abi: TRANSFER_ABI,
      functionName: "transfer",
      args: [to, amount],
    }),
  };
}

export function assertSendWithinBalance(
  asset: SendAsset,
  amount: bigint,
  balances: { native: bigint; usdt: bigint; usdc: bigint; u: bigint },
): void {
  if (asset === "tBNB") {
    if (amount + GAS_RESERVE > balances.native) {
      throw new Error(`Keep at least ${Number(MIN_NATIVE_WEI) / 1e18} tBNB for gas.`);
    }
    return;
  }
  if (asset === "USDT" && amount > balances.usdt) throw new Error("Not enough USDT.");
  if (asset === "USDC" && amount > balances.usdc) throw new Error("Not enough USDC.");
  if (asset === "U" && amount > balances.u) throw new Error("Not enough $U.");
}
