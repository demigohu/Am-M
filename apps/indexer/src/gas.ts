import type { Hex } from "viem";
import { testnetPublicClient } from "./rpc";

const receiptCache = new Map<string, bigint>();

export async function gasSpentForTx(txHash: Hex): Promise<bigint> {
  const key = txHash.toLowerCase();
  const cached = receiptCache.get(key);
  if (cached !== undefined) return cached;
  try {
    const receipt = await testnetPublicClient.getTransactionReceipt({ hash: txHash });
    const spent = receipt.gasUsed * receipt.effectiveGasPrice;
    receiptCache.set(key, spent);
    return spent;
  } catch {
    receiptCache.set(key, 0n);
    return 0n;
  }
}

export async function gasSpentForTxs(txHashes: Hex[]): Promise<bigint> {
  let total = 0n;
  const seen = new Set<string>();
  for (const hash of txHashes) {
    const key = hash.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    total += await gasSpentForTx(hash);
  }
  return total;
}
