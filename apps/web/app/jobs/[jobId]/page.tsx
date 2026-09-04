import Link from "next/link";
import { AppShell } from "../../../components/layout/AppShell";
import { JobView } from "../../../components/jobs/JobView";

export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <AppShell>
      <JobView jobId={jobId} />
    </AppShell>
  );
}
