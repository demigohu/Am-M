import Link from "next/link";
import { AppShell } from "../../components/layout/AppShell";
import { Icon } from "../../components/ui/Icon";

const EMPTY = "Not measured yet";

const TASKS = [
  {
    desk: "GRID",
    protocol: "PancakeSwap v3 SwapRouter",
    title: "Grid vs 3–5 manual swaps",
    body: "Fixed window on a liquid WBNB/USDT (Venus) pair. Compare fill, gas, and drawdown against a human clicking the PCS UI.",
    cadence: "TRADING TASK",
    cadenceIcon: "candlestick_chart",
    rows: [
      ["Window & pair", EMPTY],
      ["Time / gas / $U", EMPTY],
      ["Win rate & drawdown", EMPTY],
      ["Tx / jobId / deliverable", EMPTY],
    ],
  },
  {
    desk: "YIELD",
    protocol: "Venus vToken (testnet)",
    title: "Park yield vs Venus UI",
    body: "Same Venus market on both sides. Do not claim Lista/Aave/PCS unless both the DIY and the agent used that protocol.",
    cadence: "YIELD TASK",
    cadenceIcon: "savings",
    rows: [
      ["Market & APR source", EMPTY],
      ["Time / gas / $U", EMPTY],
      ["Output (shares / underlying)", EMPTY],
      ["Tx / jobId / deliverable", EMPTY],
    ],
  },
  {
    desk: "REBALANCE",
    protocol: "PancakeSwap v3 NFPM",
    title: "LP range reset vs PCS v3 manual",
    body: "Detect out-of-range and mint a new range around the current tick. DIY side is the same pool in the PCS UI — not a spreadsheet.",
    cadence: "LP TASK",
    cadenceIcon: "tune",
    rows: [
      ["Pool / tick / range", EMPTY],
      ["Time / gas / $U", EMPTY],
      ["In-range after action", EMPTY],
      ["Tx / jobId / deliverable", EMPTY],
    ],
  },
];

export default function ReportPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[1200px] px-4 pb-16 lg:px-10">
        <header className="border-b border-ink pt-10 pb-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink bg-surface-low px-3 py-1">
              <span className="h-2 w-2 rounded-full border border-ink bg-marigold" />
              <span className="font-mono text-[13px] tracking-wider uppercase">
                Agent Advantage Report
              </span>
            </div>
            <div className="font-mono text-[13px] text-char">TERMIX · §12 PRD</div>
          </div>
          <h1 className="mb-4 max-w-5xl font-display text-4xl font-extrabold tracking-tight md:text-[56px] md:leading-[64px]">
            Agent vs doing it yourself
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-char">
            Side-by-side for three jobs. Numbers stay empty until a real run is recorded (screen
            or tx history). Invented SLA is worse than a blank cell.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-ink/20 pt-6 md:grid-cols-4">
            {[
              ["Tasks required", "≥ 3", "One must be trading (grid)"],
              ["DIY side", "Recorded", "No fake human baseline"],
              ["Agent side", "Hired here", "Tx, jobId, deliverable"],
              ["Fill status", "Pending", "Run in the submission window"],
            ].map(([k, v, h]) => (
              <div key={k}>
                <div className="font-mono text-[13px] tracking-wider text-char uppercase">{k}</div>
                <div className="font-mono text-[28px] font-bold">{v}</div>
                <div className="text-[13px] text-char">{h}</div>
              </div>
            ))}
          </div>
        </header>

        <div className="flex flex-col gap-12 pt-12 sm:gap-20">
          {TASKS.map((task) => (
            <article
              key={task.desk}
              className="flex flex-col overflow-hidden rounded-[20px] border-2 border-ink bg-bone"
            >
              <div className="flex flex-col justify-between gap-4 border-b-2 border-ink bg-surface-high p-6 sm:p-8 md:flex-row md:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-ink px-3 py-0.5 font-mono text-[13px] font-bold text-bone">
                      {task.desk}
                    </span>
                    <span className="rounded-full border border-ink bg-surface px-3 py-0.5 font-mono text-[13px]">
                      {task.protocol}
                    </span>
                  </div>
                  <h2 className="font-display text-[28px] leading-8 font-extrabold">{task.title}</h2>
                  <p className="mt-2 max-w-3xl text-char">{task.body}</p>
                </div>
                <div className="flex items-center gap-2 self-start rounded-xl border border-ink bg-surface px-4 py-2">
                  <Icon name={task.cadenceIcon} />
                  <span className="font-mono text-[13px] font-medium">{task.cadence}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 divide-y divide-ink md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="p-6 sm:p-8">
                  <h3 className="mb-4 font-display text-xl font-medium">Without agent</h3>
                  <p className="mb-4 text-sm text-char">Human on the protocol UI</p>
                  <dl className="space-y-4">
                    {task.rows.map(([k]) => (
                      <div key={`diy-${k}`} className="border-b border-oat pb-3">
                        <dt className="text-[13px] text-char">{k}</dt>
                        <dd className="font-medium">{EMPTY}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="bg-surface-low/50 p-6 sm:p-8">
                  <h3 className="mb-4 font-display text-xl font-medium">With agent ({task.desk})</h3>
                  <p className="mb-4 text-sm text-char">Hired on Am-M</p>
                  <dl className="space-y-4">
                    {task.rows.map(([k]) => (
                      <div key={`agent-${k}`} className="border-b border-oat pb-3">
                        <dt className="text-[13px] text-char">{k}</dt>
                        <dd className="font-medium">{EMPTY}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-16 rounded-[20px] border-2 border-ink bg-ink p-8 text-bone">
          <div className="mb-2 font-mono text-[13px] tracking-wider uppercase">Next</div>
          <h2 className="mb-4 font-display text-3xl font-extrabold">Hire a desk, then fill this page</h2>
          <p className="mb-6 max-w-2xl text-[#c7c6c2]">
            Pick a job, grant a session, keep the tx hash. Come back here with the real numbers.
          </p>
          <Link
            href="/#desks"
            className="inline-flex items-center gap-2 rounded-full border border-marigold bg-marigold px-7 py-3 text-sm font-bold text-ink hover:bg-marigold-dim"
          >
            Pick a job <Icon name="arrow_forward" />
          </Link>
          <p className="mt-4 flex items-center gap-2 text-[13px] text-oat">
            <Icon name="lock" /> You keep the keys.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
