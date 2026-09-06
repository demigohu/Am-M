import Link from "next/link";
import { DESKS } from "../../lib/catalog";
import { HOME_DESK_CARDS } from "../../lib/stitch-styles";
import { MarqueeStrip } from "./MarqueeStrip";
import { RebalanceDiagram } from "./RebalanceDiagram";

const STEPS = [
  {
    n: "01",
    title: "Pick a job",
    body: "Select an autonomous strategy tailored to your liquidity pool or trading intent from verified listings.",
  },
  {
    n: "02",
    title: "Grant a bounded session",
    body: "Set exact token limits, expiry time, and approved contracts via Altana passkey account abstraction.",
  },
  {
    n: "03",
    title: "Agent transacts",
    body: "The agent rebalances, grids, or yields on BNB Chain within your rigid boundaries while you retain absolute custody.",
  },
];

export function HomeView() {
  return (
    <div className="flex w-full flex-col bg-buttercream text-ink">
      {/* Hero */}
      <section className="w-full border-b border-ink bg-buttercream px-6 pt-12 pb-16 md:pt-20">
        <div className="mx-auto flex min-h-[520px] max-w-[1200px] flex-col justify-between">
          <div className="flex max-w-[840px] flex-col items-start pt-10 md:pt-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink bg-bone px-3 py-1 font-mono text-[12px] font-medium tracking-wide">
              <span className="h-2 w-2 rounded-full border border-ink bg-status-green" />
              <span>Live (testnet)</span>
            </div>
            <h1 className="mb-6 font-display text-[44px] leading-[1.08] font-extrabold tracking-[-0.025em] md:text-[68px]">
              Hire a DeFi agent.
              <br className="hidden sm:inline" /> You keep the keys.
            </h1>
            <p className="mb-10 max-w-[680px] text-lg leading-7 text-char md:text-xl md:leading-[28px]">
              Agents execute on-chain according to your rules. Keys stay in your own passkey account
              with bounded session permissions.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/market"
                className="inline-flex items-center justify-center rounded-full border-[1.5px] border-ink bg-marigold px-8 py-3.5 text-[15px] font-bold transition-colors hover:bg-marigold-dim"
              >
                Launch app
              </Link>
              <Link
                href="/report"
                className="inline-flex items-center justify-center rounded-full border-[1.5px] border-ink bg-bone px-8 py-3.5 text-[15px] font-medium transition-colors hover:bg-buttercream"
              >
                Read the Advantage
              </Link>
            </div>
          </div>
          <div className="flex w-full justify-center pt-16">
            <a
              href="#advantage"
              aria-label="Scroll to details"
              className="flex flex-col items-center gap-1.5 text-ink opacity-80 transition-opacity hover:opacity-100"
            >
              <span className="font-mono text-[10px] tracking-widest uppercase">How it works</span>
              <svg className="h-5 w-5 fill-none stroke-ink stroke-2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <MarqueeStrip />

      {/* Feature block */}
      <section className="w-full border-b border-ink bg-buttercream px-6 py-20" id="advantage">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="flex flex-col justify-between rounded-[20px] border-2 border-ink bg-bone p-6 sm:p-8 lg:col-span-6">
            <div className="mb-6 flex items-center justify-between border-b border-ink pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-ink bg-marigold" />
                <span className="font-mono text-[12px] font-medium tracking-wider uppercase">
                  V3 tick re-anchoring
                </span>
              </div>
              <span className="font-mono text-[11px] text-char">PAIR: WBNB/USDT</span>
            </div>
            <div className="relative w-full py-4">
              <RebalanceDiagram />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink pt-3 font-mono text-[11px] text-char">
              <span>Illustrative rebalance flow</span>
              <span className="font-bold text-ink">PancakeSwap v3 NFPM</span>
            </div>
          </div>
          <div className="flex flex-col justify-center lg:col-span-6">
            <span className="mb-3 font-mono text-[12px] font-bold tracking-widest text-char uppercase">
              Protocol Mechanics
            </span>
            <h2 className="mb-8 font-display text-[36px] leading-[1.15] font-extrabold md:text-[43px]">
              How it works
            </h2>
            <div className="flex flex-col gap-6">
              {STEPS.map((step) => (
                <div
                  key={step.n}
                  className="flex items-start gap-4 rounded-xl border border-ink bg-bone p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink bg-buttercream font-mono text-[16px] font-bold">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="mb-1 font-display text-[18px] font-bold">{step.title}</h3>
                    <p className="text-base leading-6 text-char">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Desk cards */}
      <section className="w-full bg-buttercream px-6 py-20" id="desks">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="font-mono text-[12px] font-bold tracking-widest text-char uppercase">
                Four job types
              </span>
              <h2 className="font-display text-[32px] leading-tight font-extrabold md:text-[38px]">
                Pick what you need done
              </h2>
              <p className="mt-2 max-w-lg text-[15px] text-char">
                Rebalancing, grid trading, yield routing, and health-factor guard — filter by
                category on Market before you hire.
              </p>
            </div>
            <p className="max-w-xs text-left font-mono text-[13px] text-char md:text-right">
              <Link href="/market" className="font-bold underline">
                Or browse all agents
              </Link>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_DESK_CARDS.map((card) => {
              const desk = DESKS.find((d) => d.slug === card.slug)!;
              return (
                <div
                  key={card.slug}
                  className={`flex min-h-[280px] flex-col justify-between rounded-[20px] border-[1.5px] border-ink p-8 text-white transition-transform duration-150 hover:-translate-y-1 ${card.bgClass}`}
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 font-mono text-[11px] tracking-wider uppercase">
                        {card.deskNum}
                      </span>
                      <span className="h-2.5 w-2.5 rounded-full border border-black bg-white" />
                    </div>
                    <h3 className="mb-2 font-display text-2xl font-bold tracking-tight">{desk.name}</h3>
                    <p className="text-base leading-[22px] text-white/90">{card.tagline}</p>
                  </div>
                  <div className="pt-6">
                    <Link
                      href={`/market?desk=${card.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold underline underline-offset-4 transition-colors hover:text-marigold"
                    >
                      View on Market
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
