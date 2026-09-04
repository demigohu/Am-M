"use client";

import {
  isPasskeySigner,
  signerFromPasskey,
  type PasskeySigner,
  type Wallet,
} from "@altananetwork/sdk";
import type { Address } from "viem";
import { altanaClient, passkeyRpId } from "./client";
import { getStoredWallet, setStoredWallet, type StoredPasskey } from "./storage";

export type OpenWallet = {
  wallet: Wallet;
  signer: PasskeySigner;
  address: Address;
};

function persist(address: Address, signer: PasskeySigner): void {
  if (signer.credential.kind !== "webauthn") {
    throw new Error("Expected a WebAuthn passkey, not a headless key.");
  }
  setStoredWallet({
    address,
    credential: signer.credential,
  });
}

export function signerFromStored(credential: StoredPasskey): PasskeySigner {
  return signerFromPasskey(credential);
}

export async function createAccount(): Promise<OpenWallet> {
  const client = altanaClient();
  const created = await client.createPasskeyWallet({
    name: "Am-M",
    rpId: passkeyRpId(),
  });
  if (!isPasskeySigner(created.signer)) {
    throw new Error("Passkey wallet did not return a passkey signer.");
  }
  persist(created.address, created.signer);
  return { wallet: { address: created.address }, signer: created.signer, address: created.address };
}

export async function recoverAccount(): Promise<OpenWallet> {
  const client = altanaClient();
  const recovered = await client.recoverFromPasskey({
    rpId: passkeyRpId(),
    chainId: 97,
  });
  if (!isPasskeySigner(recovered.signer)) {
    throw new Error("Recovered wallet did not return a passkey signer.");
  }
  persist(recovered.address, recovered.signer);
  return {
    wallet: { address: recovered.address },
    signer: recovered.signer,
    address: recovered.address,
  };
}

/** Rebuild from localStorage credential, or recover from Keystore + passkey. */
export async function openWallet(): Promise<OpenWallet> {
  const stored = getStoredWallet();
  if (stored) {
    const signer = signerFromStored(stored.credential);
    return { wallet: { address: stored.address }, signer, address: stored.address };
  }
  return recoverAccount();
}
