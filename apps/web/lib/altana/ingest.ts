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

export type IndexerJob = {
  id: string;
  desk: string;
  agentId: string;
  wallet: string;
  publicKey: string;
  expiry: number;
  grantTx: string | null;
  status: string;
  keys: IndexerKeystoreKey[];
  executions: IndexerAgentExecution[];
  snapshots: IndexerSnapshot[];
  payments: { txHash: string; value: string }[];
};

export async function fetchJobFromIndexer(id: string): Promise<IndexerJob | null> {
  if (!ingestConfigured()) return null;
  const res = await fetch(`${indexerBase()}/v1/jobs/${encodeURIComponent(id)}`, {
    headers: indexerHeaders(),
    next: { revalidate: 15 },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as IndexerJob;
}
