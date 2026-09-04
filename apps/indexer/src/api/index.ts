import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { desc, eq, graphql, replaceBigInts } from "ponder";
import { getAddress } from "viem";
import { decryptEnvelope } from "../crypto";
import { isDesk } from "../addresses";
import {
  ensureOffchain,
  getSession,
  listActiveByDesk,
  listByWallet,
  putSession,
  revokeSession,
} from "../offchain";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: (origin) => origin || "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  }),
);

app.use("/graphql", graphql({ db, schema }));

function json(value: unknown) {
  return replaceBigInts(value, (b) => b.toString());
}

function authorized(c: { req: { header: (name: string) => string | undefined } }): boolean {
  const secret = process.env.INDEXER_SECRET?.trim() ?? "";
  if (!secret) return false;
  const header = c.req.header("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

app.get("/v1/health", (c) => c.json({ ok: true }));

app.post("/v1/sessions", async (c) => {
  if (!authorized(c)) return c.json({ error: "unauthorized" }, 401);
  await ensureOffchain();
  const body = await c.req.json<{
    id?: string;
    desk?: string;
    agentId?: string;
    wallet?: string;
    publicKey?: string;
    expiry?: number;
    grantTx?: string;
    envelope?: string;
  }>();
  if (!body.id || !body.desk || !body.envelope || !body.wallet || !body.publicKey) {
    return c.json({ error: "id, desk, wallet, publicKey, envelope required" }, 400);
  }
  if (body.envelope.length > 200_000) return c.json({ error: "envelope too large" }, 413);
  try {
    const row = await putSession({
      id: body.id,
      desk: body.desk,
      agentId: body.agentId ?? "",
      wallet: getAddress(body.wallet),
      publicKey: body.publicKey,
      expiry: Number(body.expiry ?? 0),
      grantTx: body.grantTx,
      envelope: body.envelope.trim(),
    });
    console.log(`[indexer] session stored ${row.desk}/${row.id}`);
    return c.json({
      ok: true,
      id: row.id,
      desk: row.desk,
      wallet: row.wallet,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "store failed";
    return c.json({ error: message }, 400);
  }
});

app.get("/v1/sessions", async (c) => {
  if (!authorized(c)) return c.json({ error: "unauthorized" }, 401);
  await ensureOffchain();
  const desk = c.req.query("desk") ?? "";
  const decrypt = c.req.query("decrypt") === "1";
  if (!isDesk(desk)) return c.json({ error: "desk required" }, 400);
  const rows = await listActiveByDesk(desk);
  const secret = process.env.SESSION_KEY_ENCRYPTION_KEY?.trim() ?? "";
  const items = rows.map((row) => {
    let envelope: string | undefined;
    if (decrypt) {
      if (!secret) throw new Error("SESSION_KEY_ENCRYPTION_KEY is required");
      envelope = decryptEnvelope(row.envelopeCipher, secret);
    }
    return {
      id: row.id,
      desk: row.desk,
      agentId: row.agentId,
      wallet: row.wallet,
      publicKey: row.publicKey,
      expiry: row.expiry,
      grantTx: row.grantTx,
      status: row.status,
      createdAt: row.createdAt,
      envelopeCipher: decrypt ? undefined : row.envelopeCipher,
      envelope,
    };
  });
  return c.json({ items });
});

app.delete("/v1/sessions/:id", async (c) => {
  if (!authorized(c)) return c.json({ error: "unauthorized" }, 401);
  await ensureOffchain();
  const id = c.req.param("id");
  await revokeSession(id);
  console.log(`[indexer] session revoked ${id}`);
  return c.json({ ok: true, id });
});

app.get("/v1/account/:wallet", async (c) => {
  await ensureOffchain();
  let wallet: string;
  try {
    wallet = getAddress(c.req.param("wallet"));
  } catch {
    return c.json({ error: "invalid wallet" }, 400);
  }
  const sessions = await listByWallet(wallet);
  const keys = await db
    .select()
    .from(schema.keystoreKey)
        .where(eq(schema.keystoreKey.wallet, wallet.toLowerCase() as `0x${string}`));
  const executions = await db
    .select()
    .from(schema.agentExecution)
    .where(eq(schema.agentExecution.wallet, wallet.toLowerCase() as `0x${string}`))
    .orderBy(desc(schema.agentExecution.blockNumber))
    .limit(50);
  const snapshots = await db
    .select()
    .from(schema.positionSnapshot)
    .where(eq(schema.positionSnapshot.wallet, wallet.toLowerCase() as `0x${string}`))
    .orderBy(desc(schema.positionSnapshot.takenAt))
    .limit(20);
  return c.json(
    json({
      wallet,
      sessions: sessions.map((s) => ({
        id: s.id,
        desk: s.desk,
        agentId: s.agentId,
        publicKey: s.publicKey,
        expiry: s.expiry,
        grantTx: s.grantTx,
        status: s.status,
        createdAt: s.createdAt,
      })),
      keys,
      executions,
      snapshots,
    }),
  );
});

app.get("/v1/jobs/:id", async (c) => {
  await ensureOffchain();
  const row = await getSession(c.req.param("id"));
  if (!row) return c.json({ error: "not found" }, 404);
  const keys = await db
    .select()
    .from(schema.keystoreKey)
    .where(eq(schema.keystoreKey.sessionId, row.id));
  const executions = await db
    .select()
    .from(schema.agentExecution)
    .where(eq(schema.agentExecution.sessionId, row.id))
    .orderBy(desc(schema.agentExecution.blockNumber))
    .limit(50);
  const payments = await db
    .select()
    .from(schema.hirePayment)
    .where(eq(schema.hirePayment.from, row.wallet as `0x${string}`))
    .orderBy(desc(schema.hirePayment.blockNumber))
    .limit(20);
  return c.json(
    json({
      id: row.id,
      desk: row.desk,
      agentId: row.agentId,
      wallet: row.wallet,
      publicKey: row.publicKey,
      expiry: row.expiry,
      grantTx: row.grantTx,
      status: row.status,
      keys,
      executions,
      payments,
    }),
  );
});

app.get("/v1/market", async (c) => {
  const [context] = await db.select().from(schema.marketContext).limit(1);
  const agents = await db.select().from(schema.registryAgent);
  const payments = await db
    .select()
    .from(schema.hirePayment)
    .orderBy(desc(schema.hirePayment.blockNumber))
    .limit(20);
  return c.json(json({ context: context ?? null, agents, payments }));
});

export default app;
