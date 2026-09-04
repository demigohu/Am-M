import { signerFromPrivateKey, type Session } from "@altananetwork/sdk";
import type { Hex } from "viem";

const ALTANA_SESSION_VERSION = 1;

type KeyedSigner = Session["signer"] & { _privateKey?: Hex };

function bigintReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return { $bigint: value.toString(10) };
  return value;
}

/** Byte-exact envelope matching `@bnbagent/sdk` serializeSession. Contains the session key. */
export function serializeSessionEnvelope(session: Session, privateKey: Hex): string {
  const signer = signerFromPrivateKey(privateKey) as KeyedSigner;
  const envelope = {
    version: ALTANA_SESSION_VERSION,
    walletAddress: session.walletAddress,
    publicKey: session.publicKey,
    expiry: session.expiry,
    permissions: session.permissions,
    signer: { type: "privateKey" as const, privateKey: signer._privateKey },
  };
  return JSON.stringify(envelope, bigintReplacer);
}
