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
    let detail = `Session persist failed (${res.status})`;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      if (text) detail = text.slice(0, 300);
    }
    throw new Error(detail);
  }
}

export async function deleteSessionFile(id: string): Promise<void> {
  await fetch(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {
    /* local revoke still stands if the file is already gone */
  });
}
