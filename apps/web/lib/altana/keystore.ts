import { keccak256, type Hex } from "viem";

/** Altana Keystore key id — keccak256 of the session secp256k1 public key. */
export function altanaKeyId(publicKey: Hex): Hex {
  return keccak256(publicKey);
}
