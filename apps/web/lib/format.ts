import { formatUnits } from "viem";

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatU(wei: bigint | string): string {
  const n = Number(formatUnits(typeof wei === "bigint" ? wei : BigInt(wei), 18));
  if (!Number.isFinite(n)) return wei.toString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
