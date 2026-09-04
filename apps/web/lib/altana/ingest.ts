/** Server-only forward to the VPS indexer. Never import from client components. */

function indexerBase(): string {
  return (
    process.env.INDEXER_URL?.trim().replace(/\/$/, "") ||
    process.env.SESSION_INGEST_URL?.trim().replace(/\/$/, "") ||
    ""
  );
}

function indexerSecret(): string {
  return process.env.INDEXER_SECRET?.trim() || process.env.SESSION_INGEST_SECRET?.trim() || "";
}

function indexerHeaders(): HeadersInit {
  const secret = indexerSecret();
  return {
    "content-type": "application/json",
    ...(secret ? { authorization: `Bearer ${secret}` } : {}),
  };
}

export function ingestConfigured(): boolean {
  return indexerBase() !== "" && indexerSecret() !== "";
}

export function ingestMisconfigured(): boolean {
  return (indexerBase() !== "") !== (indexerSecret() !== "");
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
