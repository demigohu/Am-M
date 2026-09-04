import { NextResponse } from "next/server";
import { fetchAllLive } from "../../../lib/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const live = await fetchAllLive();
  return NextResponse.json({ at: new Date().toISOString(), live });
}
