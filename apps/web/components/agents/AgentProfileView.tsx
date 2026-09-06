import Link from "next/link";
import { Icon } from "../ui/Icon";
import type { Agent, Desk } from "../../lib/catalog";
import { DESK_HEX } from "../../lib/stitch-styles";
import { formatU, shortAddress } from "../../lib/format";
import { ALTANA_EXPLORER, SCAN_8004, urlBscAddress } from "../../lib/altana/chain";

function MetricCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-[#f7eeca] p-4">
      <span className="block text-[13px] text-char">{label}</span>
      <div className="font-mono text-lg font-bold font-tabular">{value}</div>
      {hint ? <span className="font-mono text-[11px] text-char">{hint}</span> : null}
    </div>
  );
}

export function AgentProfileView({ agent, desk }: { agent: Agent; desk: Desk }) {
  const hex = DESK_HEX[agent.desk];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/market"
            className="inline-flex items-center gap-2 text-[15px] font-bold transition-colors hover:text-char"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Market
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] font-bold tracking-wider uppercase"
              style={{ color: hex, backgroundColor: `${hex}1a` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
              {desk.code} / {desk.name.toUpperCase()}
            </span>
            <span className="inline-flex items-center rounded-full bg-oat px-3 py-1 font-mono text-[11px] uppercase">
              Strategy: {agent.variant}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-status-green/10 px-3 py-1 font-mono text-[11px] font-semibold text-status-green">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-green" />
              Live (testnet)
            </span>
          </div>
        </div>
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">{agent.name}</h1>
          <p className="mt-1.5 max-w-3xl text-lg text-char">{agent.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Execution protocol */}
          <section className="rounded-[20px] bg-bone p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <Icon name="account_tree" style={{ color: hex }} />
                <h2 className="font-display text-2xl font-bold">Execution Protocol &amp; Architecture</h2>
              </div>
              <span className="rounded-full bg-[#f7eeca] px-2.5 py-1 font-mono text-[11px] font-medium text-char">
                NON-CUSTODIAL
              </span>
            </div>
            <p className="mb-6 text-[15px] leading-relaxed">{agent.executes}</p>
            <div className="rounded-xl bg-[#f7eeca] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="verified_user" className="text-marigold" />
                <span className="text-[15px] font-bold">Scoped session allowlist</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-[11px]">
                {agent.allowed.map((fn) => (
                  <div
                    key={fn}
                    className="flex items-center justify-between rounded bg-bone px-2.5 py-1"
                  >
                    <span className="font-semibold">{fn}</span>
                    <span className="font-bold text-status-green">PERMITTED</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2.5 text-[13px] text-char">
                <Icon name="lock" className="mt-0.5 shrink-0 text-status-red" />
                <span>
                  <strong className="text-ink">Zero transfer / withdrawal permissions.</strong>{" "}
                  Rejected: {agent.rejected.join(", ")}.
                </span>
              </div>
            </div>
          </section>

          {/* Telemetry */}
          <section className="rounded-[20px] bg-bone p-6 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Icon name="speed" style={{ color: hex }} />
                <h2 className="font-display text-2xl font-bold">Execution Telemetry</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f7eeca] px-3 py-1 font-mono text-[11px] font-semibold">
                GET /strategy
              </span>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-status-green" />
              <span className="text-[15px] font-bold tracking-wide uppercase">Live (testnet)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCell label="Live metric" value={agent.liveMetric} hint={agent.liveHint} />
              <MetricCell label="Status" value={agent.status} />
              <MetricCell label="Last action" value={agent.lastAction} />
              <MetricCell label="Engine" value={agent.engine.split("·").pop()?.trim() ?? agent.engine} />
              <MetricCell label="Pair" value={agent.pair.split(" fee")[0] ?? agent.pair} />
              <MetricCell label="Reputation" value={agent.reputation != null ? `${agent.reputation}` : "Not indexed yet"} />
            </div>
            <div className="mt-6 rounded-xl bg-[#f7eeca] p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-ink px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-bone">
                  Context (mainnet)
                </span>
                <span className="text-[13px] font-medium text-char">Not indexed yet</span>
              </div>
              <p className="text-[13px] text-char">
                Mainnet APR / benchmark figures appear here when the indexer is wired. Testnet execution
                uses {agent.liveMetric} from /strategy.
              </p>
            </div>
          </section>

          {/* Audit ledger - empty */}
          <section className="rounded-[20px] bg-bone p-6 sm:p-7">
            <div className="mb-4 flex items-center gap-3">
              <Icon name="receipt_long" style={{ color: hex }} />
              <h2 className="font-display text-2xl font-bold">Execution Audit Ledger</h2>
            </div>
            <p className="text-[13px] text-char">
              Transaction receipts from your hired sessions will appear here. Not indexed yet — grant a
              session and wait for the seller tick.
            </p>
          </section>
        </div>

        {/* Right sticky sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-4">
          <div className="rounded-[20px] bg-bone p-6">
            <div className="pb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold tracking-wider text-char uppercase">
                  Official runner
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-green/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-status-green">
                  <span className="h-2 w-2 animate-ping rounded-full bg-status-green" />
                  {agent.status}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold">{agent.name}</h3>
              <p className="mt-0.5 text-[13px] text-char">
                {desk.name} · {agent.variant}
              </p>
            </div>
            <div className="my-5 rounded-xl bg-[#f7eeca] p-4">
              <span className="font-mono text-[11px] font-bold tracking-wider text-char uppercase">
                List price
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold">{formatU(agent.priceWei)}</span>
                <span className="text-[15px] text-char">$U / job</span>
              </div>
              <span className="mt-1 block text-[13px] text-char">From studio.toml · ERC-8183</span>
            </div>
            <dl className="mb-5 flex flex-col gap-2.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-char">ERC-8004</span>
                <a className="font-bold underline" href={SCAN_8004} target="_blank" rel="noopener noreferrer">
                  #{agent.registryId}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-char">Runner wallet</span>
                <a className="underline" href={urlBscAddress(agent.wallet)} target="_blank" rel="noopener noreferrer">
                  {shortAddress(agent.wallet)}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-char">Keystore</span>
                <a className="underline" href={ALTANA_EXPLORER} target="_blank" rel="noopener noreferrer">
                  Altana
                </a>
              </div>
            </dl>
            <Link
              href={`/hire/${agent.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-marigold py-3.5 text-[15px] font-bold transition-all hover:bg-marigold-dim active:translate-y-px"
            >
              <Icon name="handshake" />
              Hire · {formatU(agent.priceWei)} $U
            </Link>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[13px] text-char">
              <Icon name="shield" className="text-[16px]" />
              No private keys required. Session scoped via passkey.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-[#f7eeca] p-4 text-[13px]">
            <Icon name="info" className="mt-0.5 shrink-0 text-marigold" />
            <span>
              Hiring initiates a Keystore session grant. Revoke anytime from{" "}
              <Link href="/account" className="font-bold underline">
                Account
              </Link>
              .
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
