import type { Hex } from "viem";
import { testnetPublicClient } from "./rpc";

export async function scanWalletTransactions(
  wallet: Hex,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<Array<{ txHash: Hex; blockNumber: bigint; to: Hex | null }>> {
  const out: Array<{ txHash: Hex; blockNumber: bigint; to: Hex | null }> = [];
  for (let b = fromBlock; b <= toBlock; b++) {
    try {
      const block = await testnetPublicClient.getBlock({
        blockNumber: b,
        includeTransactions: true,
      });
      for (const tx of block.transactions) {
        if (typeof tx === "string") continue;
        if (tx.from.toLowerCase() !== wallet.toLowerCase()) continue;
        out.push({
          txHash: tx.hash,
          blockNumber: b,
          to: tx.to ?? null,
        });
      }
    } catch {
      /* skip unreadable block */
    }
  }
  return out;
}
