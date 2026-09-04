import Link from "next/link";
import { PeanutMark } from "../brand/PeanutMark";
import { HeaderNav } from "./HeaderNav";

export function BrandLockup({
  href = "/",
  invert = false,
}: {
  href?: string;
  invert?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="Am-M home">
      <PeanutMark className="h-8 w-8" invert={invert} />
      <span
        className={`font-display text-xl font-extrabold tracking-tight ${invert ? "text-bone" : "text-ink"}`}
      >
        Am-M
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-ink bg-buttercream">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-4 lg:px-10">
        <BrandLockup />
        <HeaderNav />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-ink bg-ink py-12 text-bone">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <BrandLockup invert />
          <span className="hidden text-char sm:inline">|</span>
          <p className="text-[13px] text-[#c7c6c2]">You keep the keys.</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
          <Link href="/market" className="hover:text-marigold">
            Market
          </Link>
          <Link href="/report" className="hover:text-marigold">
            Report
          </Link>
          <a href="https://8004scan.io" target="_blank" rel="noopener noreferrer" className="hover:text-marigold">
            8004scan
          </a>
          <a
            href="https://testnet.bscscan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-marigold"
          >
            BscScan testnet
          </a>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-buttercream text-ink">
      <SiteHeader />
      <div className="flex-1 pt-20">{children}</div>
      <SiteFooter />
    </div>
  );
}
