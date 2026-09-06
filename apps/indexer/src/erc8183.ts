import { hexToString, type Hex } from "viem";
import { commerceAbi, JOB_STATUS, policyEvents } from "../abis/erc8183";
import { testnetPublicClient } from "./rpc";

export const COMMERCE_CONTRACT =
  (process.env.ERC8183_COMMERCE_ADDRESS?.trim() as Hex | undefined) ??
  ("0xa206c0517b6371c6638cd9e4a42cc9f02a33b0de" as const);

export const POLICY_CONTRACT =
  (process.env.ERC8183_POLICY_ADDRESS?.trim() as Hex | undefined) ??
  ("0xd6a4217588f6b1f5657a92a3e94e6422ad771cea" as const);

export type Polled8183Job = {
  jobId: string;
  status: string;
  statusCode: number;
  deliverableHash: Hex | null;
  deliverableUrl: string | null;
  budget: string;
  provider: Hex;
  submittedAt: string;
};

function parseDeliverableUrl(optParams: Hex | undefined): string | null {
  if (!optParams || optParams === "0x") return null;
  try {
    const raw = hexToString(optParams);
    const params = JSON.parse(raw) as { deliverable_url?: string };
    return params.deliverable_url?.trim() || null;
  } catch {
    return null;
  }
}

async function resolveDeliverableUrl(jobId: bigint): Promise<string | null> {
  try {
    const logs = await testnetPublicClient.getLogs({
      address: POLICY_CONTRACT,
      event: policyEvents[0]!,
      args: { jobId },
      fromBlock: 0n,
      toBlock: "latest",
    });
    for (const log of logs.reverse()) {
      const url = parseDeliverableUrl(log.args.optParams as Hex | undefined);
      if (url) return url;
    }
  } catch {
    /* optional */
  }
  return null;
}

export async function pollErc8183Job(jobId: string): Promise<Polled8183Job | null> {
  let id: bigint;
  try {
    id = BigInt(jobId);
  } catch {
    return null;
  }
  try {
    const job = await testnetPublicClient.readContract({
      address: COMMERCE_CONTRACT,
      abi: commerceAbi,
      functionName: "getJob",
      args: [id],
    });
    const statusCode = Number(job.status);
    const status = JOB_STATUS[statusCode] ?? `UNKNOWN_${statusCode}`;
    const deliverableUrl =
      statusCode >= 2 ? await resolveDeliverableUrl(id) : null;
    return {
      jobId: id.toString(),
      status,
      statusCode,
      deliverableHash: job.deliverable && job.deliverable !== `0x${"0".repeat(64)}` ? job.deliverable : null,
      deliverableUrl,
      budget: job.budget.toString(),
      provider: job.provider,
      submittedAt: job.submittedAt.toString(),
    };
  } catch {
    return null;
  }
}
