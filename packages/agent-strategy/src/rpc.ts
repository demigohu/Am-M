import { createPublicClient, http, type PublicClient } from "viem";
import { bscTestnet } from "viem/chains";
import { RPC_URL } from "./addresses.js";

export const publicClient: PublicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});
