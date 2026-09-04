import Link from "next/link";
import { notFound } from "next/navigation";
import { HirePanel } from "../../../components/hire/HirePanel";
import { AppShell } from "../../../components/layout/AppShell";
import { Icon } from "../../../components/ui/Icon";
import { protocolOfDesk } from "../../../lib/altana/chain";
import { AGENTS, DESK_PROVIDER, agentById, deskOf } from "../../../lib/catalog";
import { formatU, shortAddress } from "../../../lib/format";

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
  const protocol = protocolOfDesk(agent.desk);

  return (
    <AppShell>
      <main className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 lg:px-10">
        <Link
          href={`/agents/${agent.id}`}
          className="mb-6 inline-flex items-center gap-2 text-[15px] font-medium hover:underline"
        >
          <Icon name="arrow_back" />
          Back to {agent.name}
        </Link>
        <div className="mb-4 font-mono text-[13px] text-char">
          AM-M // HIRE • {desk.code} {desk.name.toUpperCase()} • BNB TESTNET
        </div>
        <h1 className="mb-2 font-display text-4xl font-extrabold tracking-tight">
          Review session: {agent.name}
        </h1>
        <p className="mb-8 max-w-3xl text-char">
          Review the allowlist and the first action. Then grant a session with passkey. No account
          or gas yet → you will be sent to Account first.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-[20px] border-2 border-ink bg-bone p-6 lg:col-span-8 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-ink bg-surface px-3 py-1 font-mono text-[13px] uppercase">
                <span className={`h-2.5 w-2.5 rounded-full ${desk.color}`} />
                {desk.code} · {desk.name}
              </span>
              <span className="rounded-full border border-ink bg-oat px-3 py-1 font-mono text-[11px] uppercase">
                ERC-8004 #{agent.registryId}
              </span>
              <span className="font-mono text-[13px] text-char">
                Provider {shortAddress(DESK_PROVIDER[agent.desk])}
              </span>
            </div>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-ink bg-surface p-4">
                <div className="text-[13px] text-char">Target Pair &amp; Pool</div>
                <div className="font-mono text-lg font-medium">{agent.pair}</div>
              </div>
              <div className="rounded-xl border border-ink bg-surface p-4">
                <div className="text-[13px] text-char">Target Contract Address</div>
                <div className="font-mono text-lg font-medium">
                  {shortAddress(protocol.address)} ({protocol.label})
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-ink bg-surface p-4">
              <div className="mb-2 flex items-center gap-2 font-bold">
                <Icon name="play_circle" /> First tick after grant
              </div>
              <p className="mb-3 text-sm text-char">{agent.firstAction}</p>
              <pre className="overflow-x-auto font-mono text-[13px]">{agent.firstActionCode}</pre>
              <p className="mt-3 flex items-center gap-2 text-[13px] text-status-green">
                <Icon name="verified_user" />                 Zero transfer to the agent. Liquidity and principal stay in your vault.
              </p>
            </div>

            <h2 className="mb-3 text-sm font-bold tracking-wider uppercase">
            Session allowlist
            </h2>
            <ul className="mb-4 space-y-2">
              {agent.allowed.map((item) => (
                <li key={item} className="flex items-start gap-2 font-mono text-[13px]">
                  <Icon name="check_circle" className="text-status-green" />
                  <span>
                    {item}
                    <span className="block text-char">ALLOWED</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 text-[13px] text-char">
              <Icon name="block" className="text-status-red" />
              Not on allowlist: {agent.rejected.join(", ") || "approve, transfer, withdraw"}.
            </p>
          </section>

          <aside className="rounded-[20px] border-2 border-ink bg-bone p-6 lg:col-span-4">
            <div className="mb-4 grid grid-cols-1 gap-3">
              {[
                ["Session lease", "30 days", "grantSession expiry"],
                ["Daily token cap", "100 USDT", "session spend permission"],
                ["Daily native cap", "0.1 tBNB", "relay gas + vBNB"],
              ].map(([k, v, h]) => (
                <div key={k} className="border-b border-oat pb-3">
                  <div className="text-[13px] text-char">{k}</div>
                  <div className="font-mono text-lg font-medium">{v}</div>
                  <div className="text-[13px] text-[#7e775f]">{h}</div>
                </div>
              ))}
            </div>
            <div className="mb-4 rounded-xl border border-ink bg-marigold/40 p-4">
              <div className="font-mono text-[12px] tracking-wider uppercase">
                ERC-8183 list price
              </div>
              <div className="font-mono text-[28px] font-medium">
                {formatU(agent.priceWei)} $U / job
              </div>
              <div className="text-[13px] text-char">studio.toml · optional if vault has no $U</div>
            </div>
            <HirePanel agent={agent} desk={desk} />
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
