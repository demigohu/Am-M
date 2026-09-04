import pg from "pg";
import { encryptEnvelope } from "./crypto.js";
import { isDesk, type Desk } from "./addresses.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export type StoredSession = {
  id: string;
  desk: Desk;
  agentId: string;
  wallet: `0x${string}`;
  publicKey: `0x${string}`;
  expiry: number;
  grantTx: string | null;
  envelopeCipher: string;
  status: "active" | "revoked";
  createdAt: string;
};

function encryptionKey(): string {
  const key = process.env.SESSION_KEY_ENCRYPTION_KEY?.trim() ?? "";
  if (!key) throw new Error("SESSION_KEY_ENCRYPTION_KEY is required");
  return key;
}

export function db(): pg.Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required");
  pool = new Pool({ connectionString: url, max: 8 });
  return pool;
}

export async function ensureOffchain(): Promise<void> {
  await db().query(`CREATE SCHEMA IF NOT EXISTS amm`);
  await db().query(`
    CREATE TABLE IF NOT EXISTS amm.user_session (
      id TEXT PRIMARY KEY,
      desk TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      wallet TEXT NOT NULL,
      public_key TEXT NOT NULL,
      expiry BIGINT NOT NULL,
      grant_tx TEXT,
      envelope_cipher TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db().query(
    `CREATE INDEX IF NOT EXISTS user_session_desk ON amm.user_session (desk)`,
  );
  await db().query(
    `CREATE INDEX IF NOT EXISTS user_session_wallet ON amm.user_session (wallet)`,
  );
}

function rowToSession(row: pg.QueryResult["rows"][number]): StoredSession {
  return {
    id: row.id,
    desk: row.desk,
    agentId: row.agent_id,
    wallet: row.wallet,
    publicKey: row.public_key,
    expiry: Number(row.expiry),
    grantTx: row.grant_tx,
    envelopeCipher: row.envelope_cipher,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function putSession(input: {
  id: string;
  desk: string;
  agentId: string;
  wallet: string;
  publicKey: string;
  expiry: number;
  grantTx?: string | null;
  envelope: string;
}): Promise<StoredSession> {
  if (!isDesk(input.desk)) throw new Error("desk required");
  const cipher = encryptEnvelope(input.envelope, encryptionKey());
  const result = await db().query(
    `INSERT INTO amm.user_session
      (id, desk, agent_id, wallet, public_key, expiry, grant_tx, envelope_cipher, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active')
     ON CONFLICT (id) DO UPDATE SET
       desk = EXCLUDED.desk,
       agent_id = EXCLUDED.agent_id,
       wallet = EXCLUDED.wallet,
       public_key = EXCLUDED.public_key,
       expiry = EXCLUDED.expiry,
       grant_tx = EXCLUDED.grant_tx,
       envelope_cipher = EXCLUDED.envelope_cipher,
       status = 'active'
     RETURNING *`,
    [
      input.id,
      input.desk,
      input.agentId,
      input.wallet.toLowerCase(),
      input.publicKey,
      input.expiry,
      input.grantTx ?? null,
      cipher,
    ],
  );
  return rowToSession(result.rows[0]);
}

export async function revokeSession(id: string): Promise<void> {
  await db().query(`UPDATE amm.user_session SET status = 'revoked' WHERE id = $1`, [id]);
}

export async function listActiveByDesk(desk: Desk): Promise<StoredSession[]> {
  const result = await db().query(
    `SELECT * FROM amm.user_session WHERE desk = $1 AND status = 'active' ORDER BY created_at ASC`,
    [desk],
  );
  return result.rows.map(rowToSession);
}

export async function listActive(): Promise<StoredSession[]> {
  const result = await db().query(
    `SELECT * FROM amm.user_session WHERE status = 'active' ORDER BY created_at ASC`,
  );
  return result.rows.map(rowToSession);
}

export async function getSession(id: string): Promise<StoredSession | null> {
  const result = await db().query(`SELECT * FROM amm.user_session WHERE id = $1`, [id]);
  return result.rows[0] ? rowToSession(result.rows[0]) : null;
}

export async function listByWallet(wallet: string): Promise<StoredSession[]> {
  const result = await db().query(
    `SELECT * FROM amm.user_session WHERE wallet = $1 ORDER BY created_at DESC`,
    [wallet.toLowerCase()],
  );
  return result.rows.map(rowToSession);
}
