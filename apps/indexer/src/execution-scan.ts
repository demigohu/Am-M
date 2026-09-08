import { decodeEventLog, parseAbiItem, pad, type Hex, type Log } from "viem";
import {
  TRANSFER_SCAN_TOKENS,
  WALLET_TOPIC_CONTRACTS,
} from "./addresses.js";
import { testnetPublicClient } from "./rpc.js";
import { scanWalletTransactions } from "./scan.js";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

const LOG_CHUNK = 2000n;

export type ScannedExecution = {
  txHash: Hex;
  blockNumber: bigint;
  target: Hex;
  value: bigint;
  recipientsVerified: boolean;
  logIndex: number;
};

function walletTopic(wallet: Hex): Hex {
  return pad(wallet, { size: 32 });
}

export function walletAppearsInLog(log: Log, wallet: Hex): boolean {
  const want = walletTopic(wallet).toLowerCase();
  return (log.topics ?? []).some((t) => t.toLowerCase() === want);
}

function toExecution(log: Log, wallet: Hex): ScannedExecution | null {
  if (!log.transactionHash || log.blockNumber == null || log.logIndex == null) {
    return null;
  }
  const topics = log.topics ?? [];
  let recipientsVerified = walletAppearsInLog(log, wallet);
  let value = 0n;

  if (
    topics[0]?.toLowerCase() ===
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
  ) {
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: topics as [Hex, ...Hex[]],
      });
      if (decoded.eventName === "Transfer") {
        const to = decoded.args.to?.toLowerCase();
        const from = decoded.args.from?.toLowerCase();
        recipientsVerified = to === wallet.toLowerCase();
        value = decoded.args.value ?? 0n;
        return {
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          target: (to ?? from ?? wallet) as Hex,
          value,
          recipientsVerified,
          logIndex: log.logIndex,
        };
      }
    } catch {
      /* fall through to generic row */
    }
  }

  return {
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    target: log.address as Hex,
    value,
    recipientsVerified,
    logIndex: log.logIndex,
  };
}

/**
 * Index strategy txs for all desks (grid / yield / guard / rebalance).
 * Altana session executes appear on Orchestrator logs; Venus/Pancake on protocol contracts;
 * mint/redeem also emits vToken Transfer.
 */
export async function scanStrategyExecutions(
  wallet: Hex,
  fromBlock: bigint,
  toBlock: bigint,
  opts?: { excludeTxHashes?: ReadonlySet<string> },
): Promise<ScannedExecution[]> {
  const exclude = opts?.excludeTxHashes ?? new Set<string>();
  const byId = new Map<string, ScannedExecution>();

  const add = (row: ScannedExecution | null) => {
    if (!row) return;
    if (exclude.has(row.txHash.toLowerCase())) return;
    const id = `${row.txHash}-${row.logIndex}`;
    if (!byId.has(id)) byId.set(id, row);
  };

  let chunkStart = fromBlock;
  while (chunkStart <= toBlock) {
    const chunkEnd =
      chunkStart + LOG_CHUNK > toBlock ? toBlock : chunkStart + LOG_CHUNK;

    const transferLogs = await Promise.all(
      TRANSFER_SCAN_TOKENS.flatMap((address) => [
        testnetPublicClient.getLogs({
          address,
          event: transferEvent,
          args: { from: wallet },
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        }),
        testnetPublicClient.getLogs({
          address,
          event: transferEvent,
          args: { to: wallet },
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        }),
      ]),
    );

    for (const log of transferLogs.flat()) {
      add(toExecution(log, wallet));
    }

    for (const address of WALLET_TOPIC_CONTRACTS) {
      let logs: Log[];
      try {
        logs = await testnetPublicClient.getLogs({
          address,
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        });
      } catch {
        continue;
      }
      for (const log of logs) {
        if (!walletAppearsInLog(log, wallet)) continue;
        add(toExecution(log, wallet));
      }
    }

    chunkStart = chunkEnd + 1n;
  }

  const walletTxs = await scanWalletTransactions(wallet, fromBlock, toBlock);
  for (const tx of walletTxs) {
    if (exclude.has(tx.txHash.toLowerCase())) continue;
    add({
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
      target: (tx.to ?? wallet) as Hex,
      value: 0n,
      recipientsVerified: true,
      logIndex: -1,
    });
  }

  return [...byId.values()];
}
