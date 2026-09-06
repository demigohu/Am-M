import { ponder } from "ponder:registry";
import {
  agentExecution,
  hirePayment,
  keystoreKey,
  marketContext,
  positionSnapshot,
  registryAgent,
} from "ponder:schema";
import { keccak256, parseAbiItem, type Hex } from "viem";
import { erc20Abi, keyStoreAbi, pcsPoolAbi, vTokenAbi } from "../abis/amm";
import {
  FIRST_PARTY_8004,
  KEYSTORE,
  MAINNET,
  SELLER_SET,
  TOKEN_U,
  USDC,
  USDT,
  VBNB,
  VUSDC,
  VUSDT,
  WBNB,
} from "./addresses";
import { fetchDeskDeliverable } from "./deliverable";
import { pollErc8183Job } from "./erc8183";
import { gasSpentForTxs } from "./gas";
import {
  listActive,
  ensureOffchain,
  getLastScannedBlock,
  setLastScannedBlock,
  upsert8183Job,
  upsertSessionDeliverable,
  setSessionGas,
} from "./offchain";
import { testnetPublicClient } from "./rpc";
import { scanWalletTransactions } from "./scan";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

const TRACKED = [TOKEN_U, USDT, USDC, WBNB] as `0x${string}`[];
const BLOCKS_PER_YEAR = 10_512_000n;

ponder.on("United:Transfer", async ({ event, context }) => {
  const to = event.args.to.toLowerCase();
  if (!SELLER_SET.has(to)) return;
  await context.db
    .insert(hirePayment)
    .values({
      id: `${event.transaction.hash}-${event.log.logIndex}`,
      txHash: event.transaction.hash,
      to: event.args.to.toLowerCase() as `0x${string}`,
      from: event.args.from.toLowerCase() as `0x${string}`,
      value: event.args.value,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })
    .onConflictDoNothing();
});

ponder.on("Tick:block", async ({ event, context }) => {
  if (!process.env.DATABASE_URL) return;
  let sessions;
  try {
    await ensureOffchain();
    sessions = await listActive();
  } catch {
    return;
  }

  const now = event.block.timestamp;
  const defaultLookback = event.block.number > 5000n ? event.block.number - 5000n : 0n;
  const LOG_CHUNK = 2000n;
const BLOCKS_PER_TICK = BigInt(
  Math.max(20, Number(process.env.INDEXER_BLOCKS_PER_TICK ?? "200") || 200),
);

  for (const session of sessions) {
    const wallet = session.wallet as Hex;
    const keyId = keccak256(session.publicKey as Hex);
    let valid = false;
    try {
      valid = await context.client.readContract({
        address: KEYSTORE,
        abi: keyStoreAbi,
        functionName: "isValidKey",
        args: [wallet, keyId],
      });
    } catch {
      valid = false;
    }
    await context.db
      .insert(keystoreKey)
      .values({
        id: `${wallet}-${keyId}`,
        wallet,
        keyId,
        sessionId: session.id,
        valid,
        expiry: BigInt(session.expiry),
        checkedAt: now,
      })
      .onConflictDoUpdate(() => ({
        valid,
        expiry: BigInt(session.expiry),
        checkedAt: now,
        sessionId: session.id,
      }));

    try {
      const extra = await context.client.readContract({
        address: KEYSTORE,
        abi: keyStoreAbi,
        functionName: "getKeys",
        args: [wallet],
      });
      for (const extraId of extra) {
        if (extraId === keyId) continue;
        let extraValid = false;
        try {
          extraValid = await context.client.readContract({
            address: KEYSTORE,
            abi: keyStoreAbi,
            functionName: "isValidKey",
            args: [wallet, extraId],
          });
        } catch {
          extraValid = false;
        }
        await context.db
          .insert(keystoreKey)
          .values({
            id: `${wallet}-${extraId}`,
            wallet,
            keyId: extraId,
            sessionId: null,
            valid: extraValid,
            expiry: 0n,
            checkedAt: now,
          })
          .onConflictDoUpdate(() => ({ valid: extraValid, checkedAt: now }));
      }
    } catch {
      /* getKeys layout may differ — isValidKey on the hired key is enough */
    }

    try {
      let grantBlock = defaultLookback;
      if (session.grantTx) {
        try {
          const receipt = await context.client.getTransactionReceipt({
            hash: session.grantTx as Hex,
          });
          grantBlock = receipt.blockNumber;
        } catch {
          /* grant receipt optional */
        }
      }

      const cursor = await getLastScannedBlock(session.id);
      const scanFrom = cursor > grantBlock ? cursor + 1n : grantBlock;
      if (scanFrom > event.block.number) {
        /* already caught up */
      } else {
        const scanTo =
          scanFrom + BLOCKS_PER_TICK > event.block.number
            ? event.block.number
            : scanFrom + BLOCKS_PER_TICK - 1n;
        const txHashes: Hex[] = [];

        let chunkStart = scanFrom;
        while (chunkStart <= scanTo) {
          const chunkEnd =
            chunkStart + LOG_CHUNK > scanTo ? scanTo : chunkStart + LOG_CHUNK;
          const logOpts = {
            address: TRACKED,
            event: transferEvent,
            fromBlock: chunkStart,
            toBlock: chunkEnd,
          };
          const [logsFrom, logsTo] = await Promise.all([
            testnetPublicClient.getLogs({ ...logOpts, args: { from: wallet } }),
            testnetPublicClient.getLogs({ ...logOpts, args: { to: wallet } }),
          ]);
          const seen = new Set<string>();
          for (const log of [...logsFrom, ...logsTo]) {
            const dedupe = `${log.transactionHash}-${log.logIndex}`;
            if (seen.has(dedupe)) continue;
            seen.add(dedupe);
            txHashes.push(log.transactionHash);
            const from = log.args.from?.toLowerCase();
            const to = log.args.to?.toLowerCase();
            const target = (to ?? from ?? wallet) as Hex;
            const verified = to === wallet.toLowerCase();
            await context.db
              .insert(agentExecution)
              .values({
                id: `${session.id}-${log.transactionHash}-${log.logIndex}`,
                sessionId: session.id,
                wallet,
                txHash: log.transactionHash,
                target,
                value: log.args.value ?? 0n,
                recipientsVerified: verified,
                timestamp: now,
                blockNumber: log.blockNumber,
              })
              .onConflictDoNothing();
          }
          chunkStart = chunkEnd + 1n;
        }

        const walletTxs = await scanWalletTransactions(wallet, scanFrom, scanTo);
        for (const tx of walletTxs) {
          txHashes.push(tx.txHash);
          await context.db
            .insert(agentExecution)
            .values({
              id: `${session.id}-${tx.txHash}-call`,
              sessionId: session.id,
              wallet,
              txHash: tx.txHash,
              target: (tx.to ?? wallet) as Hex,
              value: 0n,
              recipientsVerified: true,
              timestamp: now,
              blockNumber: tx.blockNumber,
            })
            .onConflictDoNothing();
        }

        await setLastScannedBlock(session.id, scanTo);
        try {
          const gas = await gasSpentForTxs([...new Set(txHashes.map((h) => h.toLowerCase()))] as Hex[]);
          await setSessionGas(session.id, gas);
        } catch {
          /* gas optional */
        }
      }
    } catch (err) {
      console.warn(`[indexer] execution scan failed session=${session.id}`, err);
    }

    if (session.erc8183JobId) {
      try {
        const polled = await pollErc8183Job(session.erc8183JobId);
        if (polled) {
          await upsert8183Job({
            sessionId: session.id,
            jobId: polled.jobId,
            status: polled.status,
            statusCode: polled.statusCode,
            deliverableHash: polled.deliverableHash,
            deliverableUrl: polled.deliverableUrl,
            budget: polled.budget,
            provider: polled.provider,
            submittedAt: polled.submittedAt,
          });
        }
      } catch (err) {
        console.warn(`[indexer] erc8183 poll failed session=${session.id}`, err);
      }
    }

    try {
      const deskDeliverable = await fetchDeskDeliverable(session.desk);
      await upsertSessionDeliverable({
        sessionId: session.id,
        desk: session.desk,
        summary: deskDeliverable.summary,
        payload: deskDeliverable.payload,
      });
    } catch {
      /* strategy feed optional */
    }

    try {
      const [vUsdt, vUsdc, vBnb, rateUsdt, rateUsdc, rateBnb] = await Promise.all([
        context.client.readContract({
          address: VUSDT,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [wallet],
        }),
        context.client.readContract({
          address: VUSDC,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [wallet],
        }),
        context.client.readContract({
          address: VBNB,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [wallet],
        }),
        context.client.readContract({
          address: VUSDT,
          abi: vTokenAbi,
          functionName: "exchangeRateStored",
        }),
        context.client.readContract({
          address: VUSDC,
          abi: vTokenAbi,
          functionName: "exchangeRateStored",
        }),
        context.client.readContract({
          address: VBNB,
          abi: vTokenAbi,
          functionName: "exchangeRateStored",
        }),
      ]);
      const underlying = (shares: bigint, rate: bigint) => (shares * rate) / 10n ** 18n;
      await context.db
        .insert(positionSnapshot)
        .values({
          id: `${session.id}-${event.block.number}`,
          sessionId: session.id,
          wallet,
          vUsdtUnderlying: underlying(vUsdt, rateUsdt),
          vUsdcUnderlying: underlying(vUsdc, rateUsdc),
          vBnbUnderlying: underlying(vBnb, rateBnb),
          takenAt: now,
        })
        .onConflictDoNothing();
    } catch {
      /* Venus read optional */
    }
  }

  const key = process.env.SCAN_8004_API_KEY?.trim();
  if (key) {
    for (const agent of FIRST_PARTY_8004) {
      try {
        const url = `https://api.8004scan.io/v1/agents/97/${agent.id}`;
        const res = await fetch(url, { headers: { authorization: `Bearer ${key}` } });
        if (!res.ok) continue;
        const payload: unknown = await res.json();
        const name =
          payload && typeof payload === "object" && "name" in payload
            ? String((payload as { name: unknown }).name)
            : null;
        await context.db
          .insert(registryAgent)
          .values({
            id: `97-${agent.id}`,
            chainId: 97,
            tokenId: agent.id,
            desk: agent.desk,
            hireable: true,
            name,
            payload,
            updatedAt: now,
          })
          .onConflictDoUpdate(() => ({ name, payload, updatedAt: now }));
      } catch {
        /* 8004scan optional */
      }
    }
  }
});

ponder.on("Market:block", async ({ event, context }) => {
  try {
    const [rate, slot0, liquidity] = await Promise.all([
      context.client.readContract({
        address: MAINNET.vUsdt,
        abi: vTokenAbi,
        functionName: "supplyRatePerBlock",
      }),
      context.client.readContract({
        address: MAINNET.pcsPool,
        abi: pcsPoolAbi,
        functionName: "slot0",
      }),
      context.client.readContract({
        address: MAINNET.pcsPool,
        abi: pcsPoolAbi,
        functionName: "liquidity",
      }),
    ]);
    const aprBps = Number((rate * BLOCKS_PER_YEAR * 10_000n) / 10n ** 18n);
    await context.db
      .insert(marketContext)
      .values({
        id: "bsc-mainnet",
        venusUsdtAprBps: Number.isFinite(aprBps) ? aprBps : 0,
        pcsTick: Number(slot0[1]),
        pcsLiquidity: liquidity,
        takenAt: event.block.timestamp,
        label: "Live",
      })
      .onConflictDoUpdate(() => ({
        venusUsdtAprBps: Number.isFinite(aprBps) ? aprBps : 0,
        pcsTick: Number(slot0[1]),
        pcsLiquidity: liquidity,
        takenAt: event.block.timestamp,
        label: "Live",
      }));
  } catch {
    /* mainnet context is optional */
  }
});
