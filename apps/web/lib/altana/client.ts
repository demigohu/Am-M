"use client";

import { createClient, BNB_TESTNET } from "@altananetwork/sdk";

let client: ReturnType<typeof createClient> | null = null;

export function altanaClient() {
  if (!client) {
    client = createClient({ chains: [BNB_TESTNET], defaultChainId: 97 });
  }
  return client;
}

export function passkeyRpId(): string {
  return window.location.hostname;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
