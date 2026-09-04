import { mkdir, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  ingestConfigured,
  ingestMisconfigured,
  ingestPut,
} from "../../../lib/altana/ingest";
import { ID_RE, isDeskSlug, sessionFile, sessionsRoot } from "../../../lib/altana/sessionFiles";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    id?: string;
    agentId?: string;
    desk?: string;
    envelope?: string;
    wallet?: string;
    publicKey?: string;
    expiry?: number;
    grantTx?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id || !body.envelope || typeof body.envelope !== "string") {
    return NextResponse.json({ error: "id and envelope required" }, { status: 400 });
  }
  if (!ID_RE.test(body.id)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }
  if (!isDeskSlug(body.desk)) {
    return NextResponse.json({ error: "desk required" }, { status: 400 });
  }
  if (body.envelope.length > 200_000) {
    return NextResponse.json({ error: "Envelope too large" }, { status: 413 });
  }

  const payload = {
    id: body.id,
    agentId: body.agentId ?? "",
    desk: body.desk,
    envelope: body.envelope.trim(),
    wallet: body.wallet,
    publicKey: body.publicKey,
    expiry: body.expiry,
    grantTx: body.grantTx,
  };

  if (ingestMisconfigured()) {
    return NextResponse.json(
      { error: "INDEXER_URL and INDEXER_SECRET must both be set" },
      { status: 500 },
    );
  }
  if (ingestConfigured()) {
    try {
      await ingestPut(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "VPS ingest failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const file = sessionFile(body.id, body.desk);
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, `${payload.envelope}\n`, { encoding: "utf8", mode: 0o600 });
  await chmod(file, 0o600);

  return NextResponse.json({
    ok: true,
    id: body.id,
    desk: body.desk,
    agentId: body.agentId ?? null,
    ingest: ingestConfigured(),
    dir: path.dirname(file),
    root: sessionsRoot(),
  });
}
