import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

const testnetRpc =
  process.env.BNB_TESTNET_RPC_URL ??
  process.env.PONDER_RPC_URL_97 ??
  "https://bsc-testnet-rpc.publicnode.com";

/** Full viem client for eth_getLogs — not available on Ponder's readonly context.client. */
export const testnetPublicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(testnetRpc),
});
