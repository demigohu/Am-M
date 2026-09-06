import Link from "next/link";
import { DESK_HEX } from "../../lib/stitch-styles";

const EMPTY = "Not measured yet";

const TASKS = [
  {
    desk: "GRID",
    slug: "grid" as const,
    title: "Grid trading WBNB/USDT, 24h window",
    execId: "GR-01",
  },
  {
    desk: "YIELD",
    slug: "yield" as const,
    title: "Move Venus vToken on APR shift > 0.5%",
    execId: "YD-04",
  },
  {
    desk: "REBALANCE",
    slug: "rebalance" as const,
    title: "LP range reset vs PCS v3 manual",
    execId: "RB-01",
  },
  {
    desk: "GUARD",
    slug: "guard" as const,
    title: "Detect Health Factor below threshold and repay",
    execId: "GD-11",
  },
];

export function ReportView() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-20 px-6 py-12">
      <header className="flex flex-col gap-6 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink bg-[#f7eeca] px-3 py-1 font-mono text-[11px] font-semibold tracking-wider uppercase">
            <span className="h-2 w-2 rounded-full border border-ink bg-status-green" />
            Live (testnet)
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="max-w-4xl font-display text-[56px] leading-tight font-extrabold tracking-tight">
            The Agent Advantage.
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-char">
            Side-by-side for agent vs DIY runs. Numbers stay empty until a real run is recorded.
            Invented SLA is worse than a blank cell.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-ink bg-bone p-4 font-mono text-sm md:grid-cols-3">
          {[
            ["01 /", "Tasks required", "≥ 3"],
            ["02 /", "Settlement", "BNB CHAIN TESTNET"],
            ["03 /", "Key protocol", "NON-CUSTODIAL ALTANA"],
          ].map(([num, label, val]) => (
            <div key={num} className="flex items-center gap-3 md:border-r md:border-ink/20 md:pr-4 last:md:border-r-0">
              <span className="font-bold">{num}</span>
              <span className="text-[11px] tracking-wide text-char uppercase">{label}</span>
              <span className="ml-auto font-bold font-tabular">{val}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-12">
        {TASKS.map((task) => {
          const hex = DESK_HEX[task.slug];
          return (
            <article
              key={task.desk}
              className="flex flex-col gap-6 rounded-[20px] border-[1.5px] border-ink bg-bone p-8"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-ink pb-6 md:flex-row md:items-center">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider uppercase"
                      style={{ color: hex, borderColor: hex, backgroundColor: `${hex}1a` }}
                    >
                      TASK / {task.desk} DESK
                    </span>
                    <span className="font-mono text-[11px] text-char tabular-nums">
                      EXEC-ID: #{task.execId}
                    </span>
                  </div>
                  <h2 className="font-display text-4xl font-bold">{task.title}</h2>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-ink bg-buttercream px-3 py-1.5 font-mono text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-status-amber" />
                  <span>
                    NET DELTA: <strong>{EMPTY}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col justify-between rounded-xl border border-ink bg-[#f7eeca]/40 p-6">
                  <div>
                    <span className="rounded-full border border-status-red bg-status-red/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase text-status-red">
                      Without agent · DIY
                    </span>
                    <p className="mt-4 font-display text-xl font-medium">{EMPTY}</p>
                    <ul className="mt-4 space-y-2 text-[15px] text-char">
                      {["Window & pair", "Time / gas / $U", "Outcome"].map((row) => (
                        <li key={row} className="flex justify-between border-b border-ink/10 py-1">
                          <span>{row}</span>
                          <span className="font-mono font-bold">{EMPTY}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-xl border-2 border-ink bg-buttercream p-6">
                  <div>
                    <span className="rounded-full border border-status-green bg-status-green/15 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase text-status-green">
                      With agent · Am-M
                    </span>
                    <p className="mt-4 font-display text-xl font-bold">{EMPTY}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      {["Agent ID", "Agent fee", "Network gas", "Deliverable"].map((k) => (
                        <div key={k} className="rounded-lg border border-ink bg-bone p-2.5">
                          <div className="font-mono text-[11px] uppercase text-char">{k}</div>
                          <div className="font-mono text-sm font-bold">{EMPTY}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 border-t border-ink/10 pt-4 font-mono text-[11px]">
                    <span className="text-char">STATUS:</span>{" "}
                    <span className="font-bold">{EMPTY}</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border-2 border-ink bg-bone p-6 text-center">
        <div className="flex flex-col items-center justify-center gap-2 font-mono text-sm font-bold md:flex-row md:gap-4">
          <span className="text-status-green">AGGREGATE DELTA: {EMPTY}</span>
          <span className="hidden text-char md:inline">•</span>
          <span>0 PRIVATE KEY EXPOSURE</span>
        </div>
        <div className="mt-2 font-mono text-[11px] uppercase text-char">
          Fill after TermiX submission window — no invented numbers
        </div>
      </section>

      <section className="flex flex-col items-center justify-center gap-6 py-12 text-center">
        <div className="flex max-w-xl flex-col gap-2">
          <h3 className="font-display text-2xl font-bold">
            Ready to deploy bounded agents to your liquidity pools?
          </h3>
          <p className="text-[15px] text-char">
            No private key uploads. Pure session escrows on BNB Chain.
          </p>
        </div>
        <Link
          href="/market"
          className="inline-flex items-center justify-center rounded-full border-2 border-ink bg-marigold px-10 py-4 text-base font-bold tracking-wide transition-all hover:bg-marigold-dim active:translate-y-0.5"
        >
          Launch app →
        </Link>
      </section>
    </div>
  );
}
