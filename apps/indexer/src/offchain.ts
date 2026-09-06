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
  erc8183JobId: string | null;
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
  await db().query(`
    ALTER TABLE amm.user_session
    ADD COLUMN IF NOT EXISTS erc8183_job_id TEXT
  `);
  await db().query(`
    CREATE TABLE IF NOT EXISTS amm.session_scan (
      session_id TEXT PRIMARY KEY,
      last_block BIGINT NOT NULL DEFAULT 0
    )
  `);
  await db().query(`
    CREATE TABLE IF NOT EXISTS amm.erc8183_job (
      session_id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      status TEXT NOT NULL,
      status_code INT NOT NULL,
      deliverable_hash TEXT,
      deliverable_url TEXT,
      budget TEXT,
      provider TEXT,
      submitted_at TEXT,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db().query(`
    CREATE TABLE IF NOT EXISTS amm.session_deliverable (
      session_id TEXT PRIMARY KEY,
      desk TEXT NOT NULL,
      summary TEXT,
      payload JSONB,
      taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db().query(`
    CREATE TABLE IF NOT EXISTS amm.session_gas (
      session_id TEXT PRIMARY KEY,
      gas_spent_wei TEXT NOT NULL DEFAULT '0',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export type Stored8183Job = {
  sessionId: string;
  jobId: string;
  status: string;
  statusCode: number;
  deliverableHash: string | null;
  deliverableUrl: string | null;
  budget: string;
  provider: string;
  submittedAt: string;
  checkedAt: string;
};

export type StoredDeliverable = {
  sessionId: string;
  desk: Desk;
  summary: string | null;
  payload: unknown;
  takenAt: string;
};

function rowToSession(row: pg.QueryResult["rows"][number]): StoredSession {
  return {
    id: row.id,
    desk: row.desk,
    agentId: row.agent_id,
    wallet: row.wallet,
    publicKey: row.public_key,
    expiry: Number(row.expiry),
    grantTx: row.grant_tx,
    erc8183JobId: row.erc8183_job_id ?? null,
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
  erc8183JobId?: string | null;
  envelope: string;
}): Promise<StoredSession> {
  if (!isDesk(input.desk)) throw new Error("desk required");
  const cipher = encryptEnvelope(input.envelope, encryptionKey());
  const result = await db().query(
    `INSERT INTO amm.user_session
      (id, desk, agent_id, wallet, public_key, expiry, grant_tx, erc8183_job_id, envelope_cipher, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active')
     ON CONFLICT (id) DO UPDATE SET
       desk = EXCLUDED.desk,
       agent_id = EXCLUDED.agent_id,
       wallet = EXCLUDED.wallet,
       public_key = EXCLUDED.public_key,
       expiry = EXCLUDED.expiry,
       grant_tx = EXCLUDED.grant_tx,
       erc8183_job_id = COALESCE(EXCLUDED.erc8183_job_id, amm.user_session.erc8183_job_id),
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
      input.erc8183JobId ?? null,
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

export async function patchErc8183JobId(id: string, erc8183JobId: string): Promise<StoredSession | null> {
  const result = await db().query(
    `UPDATE amm.user_session SET erc8183_job_id = $2 WHERE id = $1 RETURNING *`,
    [id, erc8183JobId],
  );
  return result.rows[0] ? rowToSession(result.rows[0]) : null;
}

export async function getLastScannedBlock(sessionId: string): Promise<bigint> {
  const result = await db().query(
    `SELECT last_block FROM amm.session_scan WHERE session_id = $1`,
    [sessionId],
  );
  if (!result.rows[0]) return 0n;
  return BigInt(result.rows[0].last_block);
}

export async function setLastScannedBlock(sessionId: string, lastBlock: bigint): Promise<void> {
  await db().query(
    `INSERT INTO amm.session_scan (session_id, last_block)
     VALUES ($1, $2)
     ON CONFLICT (session_id) DO UPDATE SET last_block = EXCLUDED.last_block`,
    [sessionId, lastBlock.toString()],
  );
}

function rowTo8183(row: pg.QueryResult["rows"][number]): Stored8183Job {
  return {
    sessionId: row.session_id,
    jobId: row.job_id,
    status: row.status,
    statusCode: Number(row.status_code),
    deliverableHash: row.deliverable_hash,
    deliverableUrl: row.deliverable_url,
    budget: row.budget,
    provider: row.provider,
    submittedAt: row.submitted_at,
    checkedAt: new Date(row.checked_at).toISOString(),
  };
}

export async function upsert8183Job(input: {
  sessionId: string;
  jobId: string;
  status: string;
  statusCode: number;
  deliverableHash: string | null;
  deliverableUrl: string | null;
  budget: string;
  provider: string;
  submittedAt: string;
}): Promise<void> {
  await db().query(
    `INSERT INTO amm.erc8183_job
      (session_id, job_id, status, status_code, deliverable_hash, deliverable_url, budget, provider, submitted_at, checked_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
     ON CONFLICT (session_id) DO UPDATE SET
       job_id = EXCLUDED.job_id,
       status = EXCLUDED.status,
       status_code = EXCLUDED.status_code,
       deliverable_hash = EXCLUDED.deliverable_hash,
       deliverable_url = COALESCE(EXCLUDED.deliverable_url, amm.erc8183_job.deliverable_url),
       budget = EXCLUDED.budget,
       provider = EXCLUDED.provider,
       submitted_at = EXCLUDED.submitted_at,
       checked_at = now()`,
    [
      input.sessionId,
      input.jobId,
      input.status,
      input.statusCode,
      input.deliverableHash,
      input.deliverableUrl,
      input.budget,
      input.provider,
      input.submittedAt,
    ],
  );
}

export async function get8183Job(sessionId: string): Promise<Stored8183Job | null> {
  const result = await db().query(`SELECT * FROM amm.erc8183_job WHERE session_id = $1`, [sessionId]);
  return result.rows[0] ? rowTo8183(result.rows[0]) : null;
}

export async function upsertSessionDeliverable(input: {
  sessionId: string;
  desk: Desk;
  summary: string | null;
  payload: unknown;
}): Promise<void> {
  await db().query(
    `INSERT INTO amm.session_deliverable (session_id, desk, summary, payload, taken_at)
     VALUES ($1,$2,$3,$4,now())
     ON CONFLICT (session_id) DO UPDATE SET
       desk = EXCLUDED.desk,
       summary = COALESCE(EXCLUDED.summary, amm.session_deliverable.summary),
       payload = EXCLUDED.payload,
       taken_at = now()`,
    [input.sessionId, input.desk, input.summary, JSON.stringify(input.payload ?? null)],
  );
}

export async function getSessionDeliverable(sessionId: string): Promise<StoredDeliverable | null> {
  const result = await db().query(`SELECT * FROM amm.session_deliverable WHERE session_id = $1`, [
    sessionId,
  ]);
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    sessionId: row.session_id,
    desk: row.desk,
    summary: row.summary,
    payload: row.payload,
    takenAt: new Date(row.taken_at).toISOString(),
  };
}

export async function setSessionGas(sessionId: string, gasSpentWei: bigint): Promise<void> {
  await db().query(
    `INSERT INTO amm.session_gas (session_id, gas_spent_wei, updated_at)
     VALUES ($1,$2,now())
     ON CONFLICT (session_id) DO UPDATE SET
       gas_spent_wei = EXCLUDED.gas_spent_wei,
       updated_at = now()`,
    [sessionId, gasSpentWei.toString()],
  );
}

export async function getSessionGas(sessionId: string): Promise<bigint> {
  const result = await db().query(`SELECT gas_spent_wei FROM amm.session_gas WHERE session_id = $1`, [
    sessionId,
  ]);
  if (!result.rows[0]) return 0n;
  try {
    return BigInt(result.rows[0].gas_spent_wei);
  } catch {
    return 0n;
  }
}
