/**
 * Test-user Altana session for Grid (no passkey / no FE).
 *
 * Reuses the healthfactor test-user admin key when present (one smart
 * account, a third scoped session). Admin-approves WBNB/USDT to SwapRouter,
 * wraps a little tBNB → WBNB if needed, grants exactInputSingle only.
 *
 * Run from app/agent:
 *   pnpm grant-user-session
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createClient,
  BNB_TESTNET,
  signerFromPrivateKey,
} from "@altananetwork/sdk";
import { serializeSession } from "@bnbagent/sdk/wallets";
import { encodeFunctionData, formatEther, type Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import {
  ERC20_ABI,
  PCS_SWAP_ROUTER,
  USDT,
  WBNB,
  gridSessionPermissions,
  publicClient,
} from "@am-m/agent-strategy";

const STUDIO_DIR = resolve(import.meta.dirname, "../../../.studio");
const ADMIN_FILE = resolve(STUDIO_DIR, "user-admin.json");
const AGENTS_ROOT = resolve(STUDIO_DIR, "../..");
const SIBLING_ADMINS = [
  resolve(AGENTS_ROOT, "healthfactor/.studio/user-admin.json"),
  resolve(AGENTS_ROOT, "rebalancing/.studio/user-admin.json"),
];
const SESSION_FILE = resolve(STUDIO_DIR, "user-session.json");
const MIN_NATIVE_WEI = 2n * 10n ** 16n;
const WRAP_WEI = 2n * 10n ** 16n;
const EXPIRY_DAYS = 30;
const NONCE_RETRY_TRIES = 4;
const NONCE_RETRY_DELAY_MS = 5_000;

const WBNB_DEPOSIT_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const;

function writePrivate(path: string, body: string): void {
  writeFileSync(path, body, { encoding: "utf8", mode: 0o600 });
  chmodSync(path, 0o600);
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

function isNonceError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.message} ${err.cause ?? ""}` : String(err);
  return /InvalidNonce|nonce/i.test(msg);
}

async function withNonceRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= NONCE_RETRY_TRIES; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isNonceError(err) || i === NONCE_RETRY_TRIES) throw err;
      console.log(
        `${label}: InvalidNonce (percobaan ${i}/${NONCE_RETRY_TRIES}), tunggu ${NONCE_RETRY_DELAY_MS / 1000}s…`,
      );
      await sleep(NONCE_RETRY_DELAY_MS);
    }
  }
  throw last;
}

function readAdminKey(file: string): Hex | null {
  if (!existsSync(file)) return null;
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { privateKey?: string };
  const key = parsed.privateKey?.trim() ?? "";
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(`${file} rusak — hapus file itu lalu jalankan lagi.`);
  }
  return key as Hex;
}

function loadOrCreateAdminKey(): Hex {
  const fromEnv = process.env.USER_ADMIN_PRIVATE_KEY?.trim();
  if (fromEnv) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(fromEnv)) {
      throw new Error("USER_ADMIN_PRIVATE_KEY harus 0x + 64 hex.");
    }
    return fromEnv as Hex;
  }
  mkdirSync(STUDIO_DIR, { recursive: true });
  const local = readAdminKey(ADMIN_FILE);
  if (local) return local;
  for (const sibling of SIBLING_ADMINS) {
    const key = readAdminKey(sibling);
    if (key) {
      writePrivate(ADMIN_FILE, `${JSON.stringify({ privateKey: key }, null, 2)}\n`);
      console.log(
        `Reuse admin user uji dari ${sibling}. Satu wallet, session Grid baru.`,
      );
      return key;
    }
  }
  const privateKey = generatePrivateKey();
  writePrivate(ADMIN_FILE, `${JSON.stringify({ privateKey }, null, 2)}\n`);
  console.log(`Admin key user uji disimpan di ${ADMIN_FILE} (mode 0600, gitignored).`);
  console.log("Jangan commit, jangan paste isi file itu di chat.");
  return privateKey;
}

async function main(): Promise<void> {
  const adminKey = loadOrCreateAdminKey();
  const admin = signerFromPrivateKey(adminKey);
  const client = createClient({ chains: [BNB_TESTNET], defaultChainId: 97 });
  const wallet = await client.createWallet({ signer: admin });

  console.log(`Wallet user uji (bukan agent): ${wallet.address}`);
  console.log("Jangan pakai USER_SESSION_FILE Guard/Rebalance — allowlist Venus/NFPM ≠ SwapRouter.");

  const [native, usdt, wbnb] = await Promise.all([
    publicClient.getBalance({ address: wallet.address }),
    publicClient.readContract({
      address: USDT,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [wallet.address],
    }),
    publicClient.readContract({
      address: WBNB,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [wallet.address],
    }),
  ]);

  console.log(`tBNB  ${formatEther(native)}`);
  console.log(`USDT  ${usdt.toString()} raw @ ${USDT}`);
  console.log(`WBNB  ${wbnb.toString()} raw @ ${WBNB}`);

  if (native < MIN_NATIVE_WEI) {
    console.log("");
    console.log(`Danai ≥ 0.02 tBNB ke ${wallet.address} lalu jalankan lagi.`);
    process.exit(2);
  }

  const [usdtAllow, wbnbAllow] = await Promise.all([
    publicClient.readContract({
      address: USDT,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [wallet.address, PCS_SWAP_ROUTER],
    }),
    publicClient.readContract({
      address: WBNB,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [wallet.address, PCS_SWAP_ROUTER],
    }),
  ]);

  const wantWrap = wbnb === 0n && native >= MIN_NATIVE_WEI + WRAP_WEI;
  const needAdmin = usdtAllow === 0n || wbnbAllow === 0n || wantWrap;

  if (needAdmin) {
    const calls: { to: typeof USDT | typeof WBNB; data: Hex; value?: bigint }[] =
      [];
    if (wantWrap) {
      calls.push({
        to: WBNB,
        data: encodeFunctionData({
          abi: WBNB_DEPOSIT_ABI,
          functionName: "deposit",
        }),
        value: WRAP_WEI,
      });
    }
    if (usdtAllow === 0n) {
      calls.push({
        to: USDT,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [PCS_SWAP_ROUTER, (1n << 256n) - 1n],
        }),
      });
    }
    if (wbnbAllow === 0n) {
      calls.push({
        to: WBNB,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [PCS_SWAP_ROUTER, (1n << 256n) - 1n],
        }),
      });
    }

    console.log(
      `Admin execute:${wantWrap ? " wrap 0.02 tBNB→WBNB," : ""} approve SwapRouter…`,
    );
    const approved = await client.execute({
      wallet,
      signer: admin,
      chainId: 97,
      calls,
    });
    console.log(
      `admin ${approved.status} ${approved.transactionHash ?? approved.callsId ?? ""}`,
    );
    if (approved.status === "FAILED") {
      throw new Error("Admin wrap/approve FAILED — cek BscScan alamat user uji.");
    }
    console.log("Tunggu nonce Keystore sebelum grantSession…");
    await sleep(NONCE_RETRY_DELAY_MS);
  } else {
    console.log("Approve SwapRouter sudah ada — skip (hindari InvalidNonce).");
  }

  const sessionKey = generatePrivateKey();
  const sessionSigner = signerFromPrivateKey(sessionKey);
  const expiry = Math.floor(Date.now() / 1000) + EXPIRY_DAYS * 24 * 60 * 60;

  console.log("grantSession Grid (PCS SwapRouter exactInputSingle, 30 hari)…");
  const granted = await withNonceRetry("grantSession", () =>
    client.grantSession({
      wallet,
      signer: admin,
      sessionSigner,
      permissions: gridSessionPermissions(),
      expiry,
      register: true,
      chainId: 97,
    }),
  );
  console.log(
    `grant ${granted.transactionHash ?? "(no hash)"} pubkey=${granted.publicKey.slice(0, 18)}…`,
  );

  mkdirSync(STUDIO_DIR, { recursive: true });
  writePrivate(SESSION_FILE, `${serializeSession(granted)}\n`);
  console.log(`Session user: ${SESSION_FILE}`);
  console.log("");
  console.log("Tambah ke agents/gridtrading/.studio/.env.local:");
  console.log(`USER_SESSION_FILE=${SESSION_FILE}`);
  console.log("ERC8183_AGENT_URL=http://127.0.0.1:9003/erc8183");
  console.log("");
  console.log("Lalu restart `bag dev --port 9003`.");
  console.log("Cek: curl -s http://localhost:9003/strategy  (bukan :9000 — itu Guard).");
  if (usdt === 0n && wbnb === 0n && !wantWrap) {
    console.log("USDT dan WBNB 0 — tick akan `blocked` sampai salah satu sisi terdanai.");
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
