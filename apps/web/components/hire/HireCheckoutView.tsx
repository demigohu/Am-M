import Link from "next/link";
import { HirePanel } from "../hire/HirePanel";
import { Icon } from "../ui/Icon";
import { protocolOfDesk } from "../../lib/altana/chain";
import { DESK_PROVIDER, type Agent, type Desk } from "../../lib/catalog";
import { DESK_HEX } from "../../lib/stitch-styles";
import { formatU, shortAddress } from "../../lib/format";

export function HireCheckoutView({ agent, desk }: { agent: Agent; desk: Desk }) {
  const hex = DESK_HEX[agent.desk];
  const protocol = protocolOfDesk(agent.desk);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/agents/${agent.id}`}
            className="group inline-flex items-center gap-1.5 text-[15px] font-bold transition-colors hover:text-char"
          >
            <Icon name="arrow_back" className="transition-transform group-hover:-translate-x-0.5" />
            Back to Agent: {agent.name}
          </Link>
          <div
            className="inline-flex items-center gap-2 rounded-full border border-ink px-3.5 py-1"
            style={{ color: hex, backgroundColor: `${hex}26` }}
          >
            <span className="h-2 w-2 rounded-full border border-ink" style={{ backgroundColor: hex }} />
            <span className="font-mono text-[11px] tracking-wider uppercase">
              Checkout // {desk.code} • {desk.name.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 pt-2 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              Authorize Agent Session: {agent.name}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[15px] text-char">
              Review cryptographic constraints, session scope, and collateral cap before granting
              delegation to this autonomous worker.
            </p>
          </div>
          <div className="hidden font-mono text-[11px] text-char md:flex md:items-center md:gap-2">
            <span>SESSION: ALTANA</span>
            <span>/</span>
            <span>CHAIN ID: 97</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left: policy dossier */}
        <section className="rounded-[20px] border-2 border-ink bg-bone p-7 md:p-8 lg:col-span-7">
          <div className="mb-6 flex items-center justify-between border-b border-ink pb-5">
            <div className="flex items-center gap-2">
              <Icon name="policy" />
              <span className="font-display text-xl font-bold">Policy Dossier</span>
            </div>
            <span className="rounded-full border border-ink bg-[#f7eeca] px-2.5 py-0.5 font-mono text-[11px] uppercase">
              Altana Session
            </span>
          </div>

          <div className="mb-7 rounded-xl border border-ink bg-buttercream p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Icon name="play_circle" className="text-marigold" />
                <span className="font-mono text-[11px] font-bold tracking-wider uppercase">
                  First-action execution preview
                </span>
              </div>
              <span className="flex items-center gap-1 font-mono text-[11px] text-status-green">
                <span className="h-1.5 w-1.5 rounded-full bg-status-green" />
                Verified call
              </span>
            </div>
            <div className="mb-2.5 rounded-lg border border-ink bg-bone/70 px-3.5 py-2.5 font-mono text-sm font-bold tracking-tight">
              {agent.firstActionCode}
            </div>
            <p className="text-[13px] leading-relaxed text-char">{agent.firstAction}</p>
          </div>

          <div className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Scoped Permission Allowlist</h3>
              <span className="font-mono text-[11px] text-char">TARGET: {protocol.label}</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-ink bg-[#f7eeca]">
              <div className="flex items-center justify-between border-b border-ink/10 p-3 font-mono text-[11px] text-char">
                <span>FUNCTION SELECTOR SIGNATURE</span>
                <span>STATUS</span>
              </div>
              <div className="divide-y divide-ink/10 bg-bone font-mono text-[11px]">
                {agent.allowed.map((fn) => (
                  <div
                    key={fn}
                    className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-buttercream/30"
                  >
                    <span className="font-medium">{fn}</span>
                    <span className="font-bold tracking-wide text-status-green">[PERMITTED]</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-ink bg-bone p-3">
              <Icon name="lock" className="mt-0.5 shrink-0 text-status-red" />
              <p className="text-[13px]">
                <span className="font-bold">Zero transfer or withdrawal permissions.</span> Not on
                allowlist: {agent.rejected.join(", ")}.
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold tracking-wider text-char uppercase">
              Fixed Session Parameters
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Session collateral cap", "100 USDT/USDC + 0.1 tBNB"],
                ["Session lease expiry", "30 days"],
                ["Target", agent.pair],
                ["Target network", "BSC Testnet (ID: 97)"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col justify-between rounded-xl border border-ink bg-[#f7eeca] p-3.5"
                >
                  <span className="font-mono text-[11px] uppercase text-char">{k}</span>
                  <span className="mt-1 font-mono text-sm font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between px-2 font-mono text-[11px] text-char">
            <div className="flex items-center gap-1.5">
              <Icon name="verified_user" />
              <span>Provider {shortAddress(DESK_PROVIDER[agent.desk])}</span>
            </div>
            <span>ERC-8004 #{agent.registryId}</span>
          </div>
        </section>

        {/* Right: retainer summary */}
        <aside className="sticky top-24 flex flex-col gap-5 lg:col-span-5">
          <div className="rounded-[20px] border-2 border-ink bg-bone p-7">
            <div className="flex items-center justify-between border-b border-ink pb-4">
              <h2 className="font-display text-xl font-bold">Retainer Summary</h2>
              <span className="font-mono text-[11px] text-char">{desk.code}</span>
            </div>
            <div className="border-b border-ink py-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[56px] font-extrabold leading-none tracking-tight">
                  {formatU(agent.priceWei)}
                </span>
                <span className="font-display text-4xl font-extrabold">$U</span>
              </div>
              <p className="mt-1 text-[13px] text-char">
                Fixed fee per job · optional ERC-8183 if vault holds $U
              </p>
            </div>
            <div className="space-y-3 border-b border-ink py-5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-char">Agent retainer:</span>
                <span className="font-bold">{formatU(agent.priceWei)} $U</span>
              </div>
              <div className="flex justify-between">
                <span className="text-char">Session setup gas:</span>
                <span className="font-bold text-status-green">From your vault</span>
              </div>
              <div className="flex justify-between">
                <span className="text-char">Key enclave:</span>
                <span className="font-bold">Hardware passkey</span>
              </div>
            </div>
            <div className="py-5">
              <HirePanel agent={agent} desk={desk} variant="checkout" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
