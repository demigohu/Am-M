import { ingestConfigured, ingestPatch8183 } from "../../../../../lib/altana/ingest";
import { ID_RE } from "../../../../../lib/altana/sessionFiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ID_RE.test(id)) {
    return Response.json({ error: "Invalid session id" }, { status: 400 });
  }
  if (!ingestConfigured()) {
    return Response.json({ error: "Indexer not configured" }, { status: 503 });
  }
  let body: { erc8183JobId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.erc8183JobId?.trim()) {
    return Response.json({ error: "erc8183JobId required" }, { status: 400 });
  }
  try {
    await ingestPatch8183(id, body.erc8183JobId.trim());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Indexer patch failed";
    return Response.json({ error: message }, { status: 502 });
  }
  return Response.json({ ok: true, id, erc8183JobId: body.erc8183JobId.trim() });
}
