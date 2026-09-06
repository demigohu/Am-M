import { notFound } from "next/navigation";
import { AppLayout } from "../../../components/layout/AppLayout";
import { AgentProfileView } from "../../../components/agents/AgentProfileView";
import { AGENTS, agentById, deskOf } from "../../../lib/catalog";
import { applyLive, fetchAgentLive } from "../../../lib/live";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return AGENTS.filter((a) => a.listed).map((a) => ({ id: a.id }));
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listed = agentById(id);
  if (!listed || !listed.listed) notFound();
  const agent = applyLive(listed, await fetchAgentLive(listed));
  const desk = deskOf(agent);

  return (
    <AppLayout>
      <AgentProfileView agent={agent} desk={desk} />
    </AppLayout>
  );
}
