import Link from "next/link";
import { AppLayout } from "../../../components/layout/AppLayout";
import { JobView } from "../../../components/jobs/JobView";

export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <AppLayout>
      <JobView jobId={jobId} />
    </AppLayout>
  );
}
