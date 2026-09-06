import { fetchAccountFromIndexer, ingestConfigured } from "../../../../lib/altana/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ wallet: string }> },
) {
  const { wallet } = await params;
  if (!ingestConfigured()) {
    return Response.json({ indexed: false, account: null });
  }
  const account = await fetchAccountFromIndexer(wallet);
  if (!account) {
    return Response.json({ indexed: false, account: null });
  }
  return Response.json({ indexed: true, account });
}
