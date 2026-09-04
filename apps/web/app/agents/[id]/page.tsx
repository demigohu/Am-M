import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { Icon } from "../../../components/ui/Icon";
import { AGENTS, agentById, deskOf } from "../../../lib/catalog";
import { formatU, shortAddress } from "../../../lib/format";
import { applyLive, fetchAgentLive } from "../../../lib/live";
import { ALTANA_EXPLORER, SCAN_8004, urlBscAddress } from "../../../lib/altana/chain";

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
    <AppShell>
      <main className="mx-auto max-w-[1200px] px-4 pb-16 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pt-8">
          <Link
            href={`/desks/${desk.slug}`}
            className="inline-flex items-center gap-2 text-[15px] font-medium hover:underline"
          >
            <Icon name="arrow_back" />
            Back to {desk.name}
          </Link>
          <div className="font-mono text-[13px] text-char">
            / Market / {desk.code} / {agent.name}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-[20px] border-2 border-ink bg-bone p-6 lg:col-span-8 lg:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-ink bg-surface px-3 py-1 font-mono text-[13px] uppercase">
                <span className={`h-2.5 w-2.5 rounded-full ${desk.color}`} />
                {desk.code} · {desk.name}
              </span>
              <span className="rounded-full border border-ink bg-oat px-3 py-1 font-mono text-[11px] uppercase">
                {agent.variant}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[13px] text-char">
                <Icon name="currency_exchange" /> {agent.pair}
              </span>
            </div>
            <h1 className="mb-3 font-display text-4xl font-extrabold tracking-tight">{agent.name}</h1>
            <p className="mb-6 max-w-3xl text-lg leading-relaxed text-char">{agent.summary}</p>
            <div className="grid grid-cols-2 gap-4 border-t border-ink pt-4 md:grid-cols-4">
              {[
                ["Engine", agent.engine],
                ["Host", "BSC testnet 97"],
                ["/strategy", agent.liveMetric],
                ["Status", agent.status],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-mono text-[12px] tracking-wider text-char uppercase">{k}</div>
                  <div className="font-medium">{v}</div>
                </div>
              ))}
            </div>
          </section>

          <aside className="flex flex-col justify-between rounded-[20px] border-2 border-ink bg-bone p-6 lg:col-span-4">
            <div>
              <div className="mb-1 font-mono text-[12px] tracking-wider text-char uppercase">
                ERC-8183 list price
              </div>
              <div className="mb-2 font-mono text-[28px] font-medium">
                {formatU(agent.priceWei)} $U <span className="text-base text-char">/ job</span>
              </div>
              <div className="mb-6 text-[13px] text-char">From studio.toml · 18-decimal $U wei</div>
              <Link
                href={`/hire/${agent.id}`}
                className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-marigold px-5 py-3 text-sm font-bold hover:bg-marigold-dim"
              >
                Hire Agent · {formatU(agent.priceWei)} $U <Icon name="lock_open" />
              </Link>
              <p className="text-[13px] text-char">
                Hire signs an Altana session. ERC-8183 retainer is optional if the vault holds $U.
              </p>
            </div>
            <dl className="mt-6 space-y-2 border-t border-ink pt-4 font-mono text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-char">Agent wallet</dt>
                <dd>
                  <a
                    className="underline"
                    href={urlBscAddress(agent.wallet)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {shortAddress(agent.wallet)}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-char">ERC-8004</dt>
                <dd>
                  <a className="underline" href={SCAN_8004} target="_blank" rel="noopener noreferrer">
                    #{agent.registryId}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-char">Keystore</dt>
                <dd>
                  <a className="underline" href={ALTANA_EXPLORER} target="_blank" rel="noopener noreferrer">
                    Altana
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-char">Endpoint</dt>
                <dd>
                  <a className="underline" href={agent.endpoint} target="_blank" rel="noopener noreferrer">
                    A2A
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-char">Last tick</dt>
                <dd className="max-w-[180px] truncate text-right">{agent.lastAction}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className="mb-8 rounded-[20px] border-2 border-ink bg-bone p-6 lg:p-8">
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-medium">
            <Icon name="account_tree" /> What it executes
          </h2>
          <p className="mb-6 max-w-4xl leading-relaxed text-char">{agent.executes}</p>
          <div className="rounded-xl border border-ink bg-surface p-4">
            <div className="mb-2 font-mono text-[12px] tracking-wider uppercase">
              FIRST TICK AFTER GRANT
            </div>
            <p className="mb-3 text-sm text-char">{agent.firstAction}</p>
            <pre className="overflow-x-auto font-mono text-[13px]">{agent.firstActionCode}</pre>
          </div>
        </section>

        <section className="rounded-[20px] border-2 border-ink bg-bone p-6 lg:p-8">
          <h2 className="mb-4 font-display text-2xl font-medium">Session allowlist</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-bold">Permitted</div>
              <ul className="space-y-1 font-mono text-[13px]">
                {agent.allowed.map((item) => (
                  <li key={item} className="flex justify-between gap-2 border-b border-oat py-1">
                    <span className="break-all">{item}</span>
                    <span className="shrink-0 text-status-green">ALLOWED</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold">Not on allowlist</div>
              <ul className="space-y-1 font-mono text-[13px]">
                {agent.rejected.map((item) => (
                  <li key={item} className="flex justify-between border-b border-oat py-1">
                    <span>{item}</span>
                    <span className="text-status-red">REJECTED</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-[13px] text-char">
            Session is 30 days, daily cap 100 USDT/USDC + 0.1 tBNB. Revoke from{" "}
            <Link href="/account" className="underline">
              Account
            </Link>
            .
          </p>
        </section>
      </main>
    </AppShell>
  );
}
