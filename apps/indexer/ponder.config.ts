import { createConfig } from "ponder";
import { http } from "viem";
import { erc20Abi } from "./abis/amm";
import { TOKEN_U } from "./src/addresses";

const testnetRpc =
  process.env.BNB_TESTNET_RPC_URL ??
  process.env.PONDER_RPC_URL_97 ??
  "https://bsc-testnet-rpc.publicnode.com";
const mainnetRpc =
  process.env.BNB_MAINNET_RPC_URL ??
  process.env.PONDER_RPC_URL_56 ??
  "https://bsc-rpc.publicnode.com";

const start97 = process.env.PONDER_START_BLOCK_97
  ? Number(process.env.PONDER_START_BLOCK_97)
  : "latest";
const start56 = process.env.PONDER_START_BLOCK_56
  ? Number(process.env.PONDER_START_BLOCK_56)
  : "latest";

export default createConfig({
  database: process.env.DATABASE_URL
    ? { kind: "postgres", connectionString: process.env.DATABASE_URL }
    : { kind: "pglite" },
  chains: {
    bscTestnet: {
      id: 97,
      rpc: http(testnetRpc),
    },
    bsc: {
      id: 56,
      rpc: http(mainnetRpc),
    },
  },
  contracts: {
    United: {
      abi: erc20Abi,
      chain: "bscTestnet",
      address: TOKEN_U,
      startBlock: start97,
    },
  },
  blocks: {
    Tick: {
      chain: "bscTestnet",
      interval: 40,
      startBlock: start97,
    },
    Market: {
      chain: "bsc",
      interval: 100,
      startBlock: start56,
    },
  },
});
