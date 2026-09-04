import Link from "next/link";
import { AppShell } from "../components/layout/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[720px] px-4 py-24 text-center">
        <p className="mb-3 font-mono text-[13px] tracking-wider text-char uppercase">Ledger miss</p>
        <h1 className="mb-4 font-display text-4xl font-extrabold">Page not in the registry</h1>
        <p className="mb-8 text-char">That desk, agent, or ticket is not listed.</p>
        <Link
          href="/market"
          className="inline-flex rounded-full border-2 border-ink bg-marigold px-6 py-3 text-sm font-bold hover:bg-marigold-dim"
        >
          Back to Market
        </Link>
      </main>
    </AppShell>
  );
}
