import { fetchJobFromIndexer } from "../../../../lib/altana/ingest";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = await fetchJobFromIndexer(jobId);
  if (!job) {
    return Response.json({ indexed: false, job: null });
  }
  return Response.json({ indexed: true, job });
}
