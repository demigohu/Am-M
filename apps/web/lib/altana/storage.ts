import type { Address, Hex } from "viem";
import type { PasskeyCredential } from "@altananetwork/sdk";
import type { DeskSlug } from "../catalog";

const WALLET_KEY = "amm.wallet";
const HIRES_KEY = "amm.hires";

export type StoredPasskey = Extract<PasskeyCredential, { kind: "webauthn" }>;

export type StoredWallet = {
  address: Address;
  credential: StoredPasskey;
};

export type StoredHire = {
  id: string;
  agentId: string;
  desk: DeskSlug;
  walletAddress: Address;
  privateKey: Hex;
  publicKey: Hex;
  expiry: number;
  transactionHash?: Hex;
  erc8183JobId?: string;
  envelope: string;
  createdAt: number;
  status: "active" | "revoked";
};

export function getStoredWallet(): StoredWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WALLET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWallet;
    if (!parsed.address?.startsWith("0x") || parsed.credential?.kind !== "webauthn") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredWallet(wallet: StoredWallet): void {
  window.localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export function getStoredAddress(): Address | null {
  return getStoredWallet()?.address ?? null;
}

export function listHires(): StoredHire[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HIRES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredHire[];
  } catch {
    return [];
  }
}

export function getHire(id: string): StoredHire | undefined {
  return listHires().find((h) => h.id === id);
}

export function upsertHire(hire: StoredHire): void {
  const next = listHires().filter((h) => h.id !== hire.id);
  next.unshift(hire);
  window.localStorage.setItem(HIRES_KEY, JSON.stringify(next));
}

export { shortAddress } from "../format";

export function remainingLabel(expiry: number): string {
  const ms = expiry * 1000 - Date.now();
  if (ms <= 0) return "EXPIRED";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 48) return `EXPIRING: ${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours >= 1) return `EXPIRING: ${hours}h ${minutes}m`;
  return `EXPIRING: ${minutes}m`;
}
