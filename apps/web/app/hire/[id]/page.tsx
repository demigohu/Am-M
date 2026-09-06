import { notFound } from "next/navigation";
import { AppLayout } from "../../../components/layout/AppLayout";
import { HireCheckoutView } from "../../../components/hire/HireCheckoutView";
import { AGENTS, agentById, deskOf } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return AGENTS.filter((a) => a.listed).map((a) => ({ id: a.id }));
}

export default async function HirePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = agentById(id);
  if (!agent || !agent.listed) notFound();
  const desk = deskOf(agent);

  return (
    <AppLayout>
      <HireCheckoutView agent={agent} desk={desk} />
    </AppLayout>
  );
}
