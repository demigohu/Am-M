import { createPublicClient, http, type PublicClient } from "viem";
import { bscTestnet } from "viem/chains";
import { RPC_URL } from "./chain";

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
}) as PublicClient;
