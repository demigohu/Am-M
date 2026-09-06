/** Server-only forward to the VPS indexer. Never import from client components. */

/**
 * Next/Turbopack inlines only *literal* `process.env.NAME`.
 * `process.env[key]` is undefined in the route bundle.
 */
function indexerBase(): string {
  return (
    process.env.INDEXER_URL?.trim() ||
    process.env.SESSION_INGEST_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
}

function indexerSecret(): string {
  return process.env.INDEXER_SECRET?.trim() || process.env.SESSION_INGEST_SECRET?.trim() || "";
}

export function ingestStatus(): { hasUrl: boolean; hasSecret: boolean; configured: boolean } {
  const hasUrl = indexerBase() !== "";
  const hasSecret = indexerSecret() !== "";
  return { hasUrl, hasSecret, configured: hasUrl && hasSecret };
}

function indexerHeaders(): HeadersInit {
  const secret = indexerSecret();
  return {
    "content-type": "application/json",
    ...(secret ? { authorization: `Bearer ${secret}` } : {}),
  };
}

export function ingestConfigured(): boolean {
  return ingestStatus().configured;
}

export function ingestMisconfigured(): boolean {
  const { hasUrl, hasSecret } = ingestStatus();
  return hasUrl !== hasSecret;
}

export async function ingestPut(input: {
  id: string;
  agentId: string;
  desk: string;
  envelope: string;
  wallet?: string;
  publicKey?: string;
  expiry?: number;
  grantTx?: string;
  erc8183JobId?: string;
}): Promise<void> {
  const res = await fetch(`${indexerBase()}/v1/sessions`, {
    method: "POST",
    headers: indexerHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Indexer persist failed (${res.status}): ${text || res.statusText}`);
  }
}

export async function ingestDelete(id: string): Promise<void> {
  const res = await fetch(`${indexerBase()}/v1/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: indexerHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Indexer delete failed (${res.status}): ${text || res.statusText}`);
  }
}

export type IndexerAgentExecution = {
  id: string;
  sessionId: string;
  wallet: string;
  txHash: string;
  target: string;
  value: string;
  recipientsVerified: boolean;
  timestamp: string;
  blockNumber: string;
};

export type IndexerKeystoreKey = {
  keyId: string;
  valid: boolean;
  expiry: string;
};

export type IndexerSnapshot = {
  vUsdtUnderlying: string;
  vUsdcUnderlying: string;
  vBnbUnderlying: string;
  takenAt: string;
};

export async function ingestPatch8183(id: string, erc8183JobId: string): Promise<void> {
  const res = await fetch(`${indexerBase()}/v1/sessions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: indexerHeaders(),
    body: JSON.stringify({ erc8183JobId }),
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Indexer patch failed (${res.status}): ${text || res.statusText}`);
  }
}

export type IndexerSessionMetrics = {
  executionCount: number;
  strategyTxCount: number;
  snapshotCount: number;
  netYieldUsdt: string;
  netYieldUsdc: string;
  netYieldBnb: string;
  gasSpentWei: string;
  positionSummary: string | null;
};

export type Indexer8183Job = {
  sessionId: string;
  jobId: string;
  status: string;
  statusCode: number;
  deliverableHash: string | null;
  deliverableUrl: string | null;
  budget: string;
  provider: string;
  submittedAt: string;
  checkedAt: string;
};

export type IndexerDeliverable = {
  sessionId: string;
  desk: string;
  summary: string | null;
  payload: unknown;
  takenAt: string;
};

export type IndexerAccountSession = {
  id: string;
  desk: string;
  agentId: string;
  publicKey: string;
  expiry: number;
  grantTx: string | null;
  erc8183JobId: string | null;
  status: string;
  createdAt: string;
  metrics: IndexerSessionMetrics;
  erc8183: Indexer8183Job | null;
  deliverable: IndexerDeliverable | null;
};

export type IndexerAccount = {
  wallet: string;
  sessions: IndexerAccountSession[];
  keys: IndexerKeystoreKey[];
  executions: IndexerAgentExecution[];
  snapshots: IndexerSnapshot[];
  pnl: {
    netYieldUsdt: string;
    gasSpentWei: string;
    strategyTxCount: number;
    activeSessions: number;
  };
};

export type IndexerMarketContext = {
  venusUsdtAprBps: number;
  pcsTick: number;
  pcsLiquidity: string;
  takenAt: string;
  label: string;
} | null;

export type IndexerRegistryAgent = {
  id: string;
  chainId: number;
  tokenId: number;
  desk: string;
  hireable: boolean;
  name: string | null;
  updatedAt: string;
};

export type IndexerMarket = {
  context: IndexerMarketContext;
  agents: IndexerRegistryAgent[];
  payments: { txHash: string; value: string; to: string; from: string }[];
};

export type IndexerJob = {
  id: string;
  desk: string;
  agentId: string;
  wallet: string;
  publicKey: string;
  expiry: number;
  grantTx: string | null;
  erc8183JobId: string | null;
  status: string;
  keys: IndexerKeystoreKey[];
  executions: IndexerAgentExecution[];
  snapshots: IndexerSnapshot[];
  payments: { txHash: string; value: string }[];
  metrics?: IndexerSessionMetrics;
  erc8183?: Indexer8183Job | null;
  deliverable?: IndexerDeliverable | null;
};

export async function fetchAccountFromIndexer(wallet: string): Promise<IndexerAccount | null> {
  if (!indexerBase()) return null;
  const res = await fetch(`${indexerBase()}/v1/account/${encodeURIComponent(wallet)}`, {
    next: { revalidate: 15 },
  });
  if (!res.ok) return null;
  return (await res.json()) as IndexerAccount;
}

export async function fetchMarketFromIndexer(): Promise<IndexerMarket | null> {
  if (!indexerBase()) return null;
  const res = await fetch(`${indexerBase()}/v1/market`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return null;
  return (await res.json()) as IndexerMarket;
}

export async function fetchJobFromIndexer(id: string): Promise<IndexerJob | null> {
  if (!indexerBase()) return null;
  const res = await fetch(`${indexerBase()}/v1/jobs/${encodeURIComponent(id)}`, {
    next: { revalidate: 15 },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as IndexerJob;
}
