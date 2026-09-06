import { notFound } from "next/navigation";
import { AppLayout } from "../../../components/layout/AppLayout";
import { AgentProfileView } from "../../../components/agents/AgentProfileView";
import { AGENTS, agentById, deskOf } from "../../../lib/catalog";
import { fetchMarketFromIndexer, ingestConfigured } from "../../../lib/altana/ingest";
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
  const indexer = ingestConfigured() ? await fetchMarketFromIndexer() : null;
  const registryMeta = indexer?.agents.find((a) => a.tokenId === agent.registryId) ?? null;
  const recentHireTxs =
    indexer?.payments.filter((p) => p.to.toLowerCase() === agent.wallet.toLowerCase()) ?? [];

  return (
    <AppLayout>
      <AgentProfileView
        agent={agent}
        desk={desk}
        mainnetContext={indexer?.context ?? null}
        registryMeta={
          registryMeta
            ? { name: registryMeta.name, updatedAt: registryMeta.updatedAt }
            : null
        }
        recentHireTxs={recentHireTxs}
      />
    </AppLayout>
  );
}
