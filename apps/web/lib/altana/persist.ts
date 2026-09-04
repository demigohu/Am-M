"use client";

export async function postSessionFile(input: {
  id: string;
  agentId: string;
  desk: string;
  envelope: string;
  wallet?: string;
  publicKey?: string;
  expiry?: number;
  grantTx?: string;
}): Promise<void> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Session persist failed (${res.status})`);
  }
}

export async function deleteSessionFile(id: string): Promise<void> {
  await fetch(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {
    /* local revoke still stands if the file is already gone */
  });
}
