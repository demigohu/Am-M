/**
 * Test-user Altana session for Guard (no passkey / no FE).
 *
 * Creates a throwaway smart account, admin-approves Venus, grants a bounded
 * session, and writes serializeSession() for USER_SESSION_FILE.
 *
 * Run from app/agent:
 *   pnpm grant-user-session
 *
 * Never prints keys. Files land in agents/healthfactor/.studio/ (gitignored).
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
  COMPTROLLER,
  COMPTROLLER_ABI,
  ERC20_ABI,
  USDC,
  USDT,
  VBNB,
  VUSDC,
  VUSDT,
  guardSessionPermissions,
  publicClient,
} from "@am-m/agent-strategy";

const STUDIO_DIR = resolve(import.meta.dirname, "../../../.studio");
const ADMIN_FILE = resolve(STUDIO_DIR, "user-admin.json");
const SESSION_FILE = resolve(STUDIO_DIR, "user-session.json");
const MIN_NATIVE_WEI = 2n * 10n ** 16n; // 0.02 tBNB
const EXPIRY_DAYS = 30;
const NONCE_RETRY_TRIES = 4;
const NONCE_RETRY_DELAY_MS = 5_000;

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

function loadOrCreateAdminKey(): Hex {
  const fromEnv = process.env.USER_ADMIN_PRIVATE_KEY?.trim();
  if (fromEnv) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(fromEnv)) {
      throw new Error("USER_ADMIN_PRIVATE_KEY harus 0x + 64 hex.");
    }
    return fromEnv as Hex;
  }
  mkdirSync(STUDIO_DIR, { recursive: true });
  if (existsSync(ADMIN_FILE)) {
    const parsed = JSON.parse(readFileSync(ADMIN_FILE, "utf8")) as {
      privateKey?: string;
    };
    const key = parsed.privateKey?.trim() ?? "";
    if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
      throw new Error(`${ADMIN_FILE} rusak — hapus file itu lalu jalankan lagi.`);
    }
    return key as Hex;
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
  console.log("Ini Altana smart account. Passkey/FE di-skip; admin-nya EOA tes.");

  const [native, usdt, usdc] = await Promise.all([
    publicClient.getBalance({ address: wallet.address }),
    publicClient.readContract({
      address: USDT,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [wallet.address],
    }),
    publicClient.readContract({
      address: USDC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [wallet.address],
    }),
  ]);

  console.log(`tBNB  ${formatEther(native)}`);
  console.log(`USDT  ${usdt.toString()} raw @ ${USDT}`);
  console.log(`USDC  ${usdc.toString()} raw @ ${USDC}`);

  if (native < MIN_NATIVE_WEI) {
    console.log("");
    console.log(`Danai ≥ 0.02 tBNB ke ${wallet.address} lalu jalankan perintah yang sama.`);
    console.log("Faucet tBNB: https://www.bnbchain.org/en/testnet-faucet");
    console.log("USDT/USDC Venus testnet: https://testnet.venus.io/ (faucet di app)");
    process.exit(2);
  }

  const [usdtAllow, usdcAllow, inMarkets] = await Promise.all([
    publicClient.readContract({
      address: USDT,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [wallet.address, VUSDT],
    }),
    publicClient.readContract({
      address: USDC,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [wallet.address, VUSDC],
    }),
    publicClient.readContract({
      address: COMPTROLLER,
      abi: COMPTROLLER_ABI,
      functionName: "getAssetsIn",
      args: [wallet.address],
    }),
  ]);
  const entered = new Set(inMarkets.map((a) => a.toLowerCase()));
  const needAdmin =
    usdtAllow === 0n ||
    usdcAllow === 0n ||
    !entered.has(VUSDT.toLowerCase()) ||
    !entered.has(VUSDC.toLowerCase()) ||
    !entered.has(VBNB.toLowerCase());

  if (needAdmin) {
    const approveCalls = [
      {
        to: USDT,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [VUSDT, (1n << 256n) - 1n],
        }),
      },
      {
        to: USDC,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [VUSDC, (1n << 256n) - 1n],
        }),
      },
      {
        to: COMPTROLLER,
        data: encodeFunctionData({
          abi: COMPTROLLER_ABI,
          functionName: "enterMarkets",
          args: [[VUSDT, VUSDC, VBNB]],
        }),
      },
    ];

    console.log("Admin execute: approve vUSDT/vUSDC + enterMarkets…");
    const approved = await client.execute({
      wallet,
      signer: admin,
      chainId: 97,
      calls: approveCalls,
    });
    console.log(
      `approve ${approved.status} ${approved.transactionHash ?? approved.callsId ?? ""}`,
    );
    if (approved.status === "FAILED") {
      throw new Error(
        "Admin approve/enterMarkets FAILED — cek BscScan alamat user uji.",
      );
    }
    console.log("Tunggu nonce Keystore sebelum grantSession…");
    await sleep(NONCE_RETRY_DELAY_MS);
  } else {
    console.log("Approve + enterMarkets sudah ada — skip (hindari InvalidNonce).");
  }

  const sessionKey = generatePrivateKey();
  const sessionSigner = signerFromPrivateKey(sessionKey);
  const expiry = Math.floor(Date.now() / 1000) + EXPIRY_DAYS * 24 * 60 * 60;

  console.log("grantSession Guard (mint/repay/redeem Venus, 30 hari)…");
  const granted = await withNonceRetry("grantSession", () =>
    client.grantSession({
      wallet,
      signer: admin,
      sessionSigner,
      permissions: guardSessionPermissions(),
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
  console.log("Tambah ke .studio/.env.local (satu baris):");
  console.log(`USER_SESSION_FILE=${SESSION_FILE}`);
  console.log("");
  console.log("Lalu restart `bag dev`. Tick harus berhenti idle.");
  if (usdt === 0n && usdc === 0n) {
    console.log("USDT/USDC masih 0 — tick akan `blocked` sampai kamu danai underlying.");
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
