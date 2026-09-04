import Link from "next/link";
import { AppShell } from "../components/layout/AppShell";
import { DESKS } from "../lib/catalog";
import { SCAN_8004 } from "../lib/altana/chain";

export default function HomePage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[1200px] px-4 lg:px-10">
        <div className="mb-12 flex flex-wrap items-center justify-between border-b border-ink pb-2 font-mono text-[13px] text-char">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-medium text-ink">AM-M</span>
            <span>•</span>
            <span>FOUR JOBS</span>
            <span>•</span>
            <span>BNB TESTNET</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-block h-2 w-2 rounded-full bg-status-green" />
            <span className="font-medium text-ink">4 SELLERS · AMMLABS.FUN</span>
          </div>
        </div>

        <section className="flex flex-col items-start pt-4 pb-12">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink bg-status-green/10 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-status-green" />
              <span className="text-[13px] font-bold tracking-wide">Live (testnet)</span>
            </div>
          </div>
          <h1 className="mb-6 max-w-4xl font-display text-4xl leading-[1.08] font-extrabold tracking-tight md:text-[56px] md:leading-[64px]">
            Hire a DeFi agent. You keep the keys.
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-char">
            Four jobs on BNB Chain: keep an LP in range, run a grid, park yield, or guard a
            health factor. Pick a desk, grant a bounded session, revoke anytime.
          </p>
          <div className="flex w-full flex-col justify-between gap-6 border-t border-ink/20 pt-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#desks"
                className="inline-flex items-center rounded-full border border-ink bg-marigold px-7 py-3 text-sm font-bold hover:bg-marigold-dim"
              >
                Pick a job
              </a>
              <Link
                href="/market"
                className="inline-flex items-center rounded-full border border-ink px-7 py-3 text-sm font-bold hover:bg-bone"
              >
                Compare sellers
              </Link>
            </div>
            <p className="max-w-sm text-sm text-char">
              Account is a passkey on this site — not MetaMask, not a hosted login.
            </p>
          </div>
        </section>

        <div className="flex h-20 items-center">
          <div className="w-full border-t-2 border-ink" />
        </div>

        <section id="how-it-works" className="scroll-mt-24">
          <div className="mb-8 flex items-baseline justify-between border-b border-ink pb-2">
            <h2 className="font-display text-2xl font-medium">How it works</h2>
            <span className="font-mono text-[13px] tracking-widest text-char uppercase">
              Hire · Grant · Tick
            </span>
          </div>
          <div className="grid grid-cols-1 divide-y divide-ink border-y border-ink md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              {
                n: "01",
                tag: "JOB",
                tagClass: "bg-bone",
                title: "Pick a desk",
                body: "Rebalance, Grid, Yield, or Guard. Each listing shows live ticks for that job — not a generic agent card.",
                foot: "THEN OPEN THE AGENT",
              },
              {
                n: "02",
                tag: "GRANT",
                tagClass: "bg-marigold",
                title: "Grant a bounded session",
                body: "Review the allowlist and the first action. Face ID on /account, then grant. Spend cap and expiry are on-chain.",
                foot: "REVOKE FROM /ACCOUNT",
              },
              {
                n: "03",
                tag: "TICK",
                tagClass: "bg-bone",
                title: "Agent transacts",
                body: "The seller process ticks on your session. You keep admin. One revoke stops that agent.",
                foot: "KEYS STAY WITH YOU",
              },
            ].map((step) => (
              <div key={step.n} className="flex min-h-[290px] flex-col justify-between p-8">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[28px] font-bold">{step.n}</span>
                    <span
                      className={`rounded-full border border-ink px-2 py-0.5 font-mono text-[13px] ${step.tagClass}`}
                    >
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="mb-2 font-display text-2xl font-medium">{step.title}</h3>
                  <p className="leading-relaxed text-char">{step.body}</p>
                </div>
                <div className="mt-4 border-t border-oat pt-4 font-mono text-[13px] text-char">
                  {step.foot}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex h-20 items-center">
          <div className="w-full border-t-2 border-ink" />
        </div>

        <section id="desks" className="scroll-mt-24 pb-4">
          <div className="mb-8 flex items-baseline justify-between border-b border-ink pb-2">
            <h2 className="font-display text-2xl font-medium">Four desks</h2>
            <span className="font-mono text-[13px] text-char">1 SELLER EACH · TESTNET</span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {DESKS.map((desk) => (
              <div
                key={desk.slug}
                className="flex min-h-[300px] flex-col justify-between rounded-[20px] border border-ink bg-bone p-8 transition-transform hover:-translate-y-1"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-oat pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${desk.color}`} />
                      <span className="font-mono text-[13px] tracking-wider uppercase">
                        {desk.mark}
                      </span>
                    </div>
                    <span className="font-mono text-[13px] text-char">{desk.code}</span>
                  </div>
                  <h3 className="mb-1 font-display text-2xl font-medium">{desk.name}</h3>
                  <p className="mb-6 leading-relaxed text-char">{desk.job}</p>
                </div>
                <div className="flex items-center justify-between border-t border-oat pt-4">
                  <Link
                    href={`/desks/${desk.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-bold hover:underline"
                  >
                    See listings <span>→</span>
                  </Link>
                  <span className="font-mono text-[13px] text-char">{desk.listingsLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-8 pb-12">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-y border-ink py-4 text-center">
            <a
              href="https://testnet.bscscan.com"
              className="text-[15px] font-bold underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              BscScan testnet
            </a>
            <span className="text-char">·</span>
            <a
              href={SCAN_8004}
              className="text-[15px] font-bold underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              8004scan
            </a>
            <span className="text-char">·</span>
            <Link href="/account" className="text-[15px] font-bold underline underline-offset-4">
              Account
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
