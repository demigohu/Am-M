import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { Icon } from "../../../components/ui/Icon";
import { DeskAgentTable } from "../../../components/inventory/DeskAgentTable";
import { agentsForDesk, deskBySlug, type DeskSlug } from "../../../lib/catalog";
import { shortAddress } from "../../../lib/format";
import { applyLive, fetchAgentLive } from "../../../lib/live";
import { SCAN_8004, urlBscAddress } from "../../../lib/altana/chain";

export const dynamic = "force-dynamic";

const slugs: DeskSlug[] = ["rebalance", "grid", "yield", "guard"];

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

export default async function DeskPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const desk = deskBySlug(slug);
  if (!desk) notFound();
  const listed = agentsForDesk(desk.slug);
  const agents = await Promise.all(
    listed.map(async (agent) => applyLive(agent, await fetchAgentLive(agent))),
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-[1200px] px-4 pb-16 lg:px-10">
        <div className="-mx-4 mb-8 border-b border-ink bg-surface-high px-4 py-2.5 lg:-mx-10 lg:px-10">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 font-mono text-[13px] uppercase tracking-wider">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">AM-M // AISLE</span>
              <span className="text-[#7e775f]">·</span>
              <span className="font-bold">
                {desk.code} {desk.name}
              </span>
              <span className="rounded border border-ink bg-bone px-1.5 py-0.5 text-[11px] font-medium">
                BNB CHAIN TESTNET
              </span>
            </div>
            <span className="font-bold tracking-widest">1 SELLER</span>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/market" className="inline-flex items-center gap-2 text-[15px] font-medium hover:underline">
            <Icon name="arrow_back" />
            Back to market
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-bone px-3 py-1 font-mono text-[13px]">
            <span className="h-2 w-2 rounded-full bg-status-green" />
            Live (testnet)
          </span>
        </div>

        <section className="mb-8 rounded-[20px] border-2 border-ink bg-bone p-6 lg:p-8">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink bg-surface px-3 py-1">
                <span className={`h-2.5 w-2.5 rounded-full ${desk.color}`} />
                <span className="font-mono text-[13px] font-medium tracking-wide uppercase">
                  {desk.code} · {desk.name}
                </span>
              </div>
              <h1 className="mb-3 font-display text-4xl font-extrabold tracking-tight">
                {desk.name} Desk
              </h1>
              <p className="mb-4 max-w-2xl text-lg leading-relaxed text-char">{desk.blurb}</p>
              <a
                href={desk.protocolHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-4"
              >
                {desk.protocol}
                <Icon name="arrow_outward" />
              </a>
            </div>
            <div className="flex h-full flex-col justify-between rounded-xl border border-ink bg-surface-low p-5 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-ink pb-3 text-sm font-bold tracking-wider text-char uppercase">
                <span>SELLER</span>
                <span className="font-mono text-[13px] font-medium text-ink">FROM STUDIO.TOML</span>
              </div>
              {agents[0] ? (
                <dl className="grid grid-cols-1 gap-3 pt-4 font-mono text-[13px]">
                  <div>
                    <dt className="text-char">ERC-8004</dt>
                    <dd>
                      <a
                        className="underline"
                        href={SCAN_8004}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        #{agents[0].registryId}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-char">Wallet</dt>
                    <dd>
                      <a
                        className="underline"
                        href={urlBscAddress(agents[0].wallet)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {shortAddress(agents[0].wallet)}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-char">Endpoint</dt>
                    <dd>
                      <a className="underline" href={agents[0].endpoint} target="_blank" rel="noopener noreferrer">
                        {agents[0].endpoint.replace("https://", "")}
                      </a>
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>
          </div>
        </section>

        <DeskAgentTable desk={desk} agents={agents} />
      </main>
    </AppShell>
  );
}
