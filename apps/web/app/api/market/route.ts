import { NextResponse } from "next/server";
import { fetchMarketFromIndexer, ingestConfigured } from "../../../lib/altana/ingest";
import { fetchAllLive } from "../../../lib/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [live, indexer] = await Promise.all([
    fetchAllLive(),
    ingestConfigured() ? fetchMarketFromIndexer() : Promise.resolve(null),
  ]);
  return NextResponse.json({
    at: new Date().toISOString(),
    live,
    indexer: indexer ?? null,
  });
}
