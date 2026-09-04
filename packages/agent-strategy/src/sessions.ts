import { createDecipheriv, createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Session } from "@altananetwork/sdk";
import { deserializeSession } from "@bnbagent/sdk/wallets";

/** Same AES-256-GCM blob as apps/indexer/src/crypto.ts. Decrypt only in agent memory. */
function decryptEnvelope(blob: string, secret: string): string {
  const key = createHash("sha256").update(secret, "utf8").digest();
  const raw = Buffer.from(blob, "base64");
  if (raw.length < 29) throw new Error("cipher too short");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/**
 * Load user Altana sessions for strategy ticks.
 *
 * Never log the payload — it contains the session private key.
 * Sources (first match wins per entry):
 *   INDEXER_URL + INDEXER_SECRET + AMM_DESK — encrypted rows from apps/indexer
 *   USER_SESSION          — one serialized session JSON string
 *   USER_SESSION_FILE     — path to one serializeSession() file
 *   USER_SESSIONS_DIR     — directory of *.json files
 */
export async function loadUserSessions(): Promise<Session[]> {
  const out: Session[] = [];
  const fromIndexer = await loadFromIndexer();
  out.push(...fromIndexer);

  const env = process.env.USER_SESSION;
  if (env && env.trim() !== "") {
    out.push(await deserializeSession(env));
  }
  const file = process.env.USER_SESSION_FILE;
  if (file && existsSync(file)) {
    out.push(await deserializeSession(readFileSync(file, "utf8")));
  }
  const dir = process.env.USER_SESSIONS_DIR;
  if (dir && existsSync(dir)) {
    const files = readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .sort();
    for (const name of files) {
      const body = readFileSync(path.join(dir, name), "utf8");
      if (body.trim() === "") continue;
      out.push(await deserializeSession(body));
    }
  }
  return out;
}

async function loadFromIndexer(): Promise<Session[]> {
  const base = process.env.INDEXER_URL?.trim().replace(/\/$/, "");
  const secret = process.env.INDEXER_SECRET?.trim();
  const desk = process.env.AMM_DESK?.trim();
  const encKey = process.env.SESSION_KEY_ENCRYPTION_KEY?.trim();
  if (!base || !secret || !desk || !encKey) return [];
  const res = await fetch(`${base}/v1/sessions?desk=${encodeURIComponent(desk)}`, {
    headers: { authorization: `Bearer ${secret}` },
  });
  if (!res.ok) {
    console.warn(`[strategy.tick] indexer sessions ${res.status}`);
    return [];
  }
  const body = (await res.json()) as {
    items?: { envelope?: string; envelopeCipher?: string }[];
  };
  const out: Session[] = [];
  for (const item of body.items ?? []) {
    const raw = item.envelope
      ? item.envelope
      : item.envelopeCipher
        ? decryptEnvelope(item.envelopeCipher, encKey)
        : "";
    if (!raw.trim()) continue;
    out.push(await deserializeSession(raw));
  }
  return out;
}
