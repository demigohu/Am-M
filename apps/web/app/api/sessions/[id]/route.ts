import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { ingestConfigured, ingestDelete } from "../../../../lib/altana/ingest";
import { allSessionCandidates, ID_RE } from "../../../../lib/altana/sessionFiles";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }
  if (ingestConfigured()) {
    await ingestDelete(id).catch(() => undefined);
  }
  await Promise.all(
    allSessionCandidates(id).map((file) => unlink(file).catch(() => undefined)),
  );
  return NextResponse.json({ ok: true });
}
