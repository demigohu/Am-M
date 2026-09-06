import Image from "next/image";
import Link from "next/link";
import { HeaderNav } from "./HeaderNav";

export function BrandLockup({
  href = "/",
  variant = "nav",
  showTagline = false,
}: {
  href?: string;
  /** nav: 32px logo + 24px wordmark · footer: 28px logo + 20px wordmark (optical balance) */
  variant?: "nav" | "footer";
  showTagline?: boolean;
}) {
  const invert = variant === "footer";
  const logoHeight = variant === "nav" ? 32 : 28;
  const wordmarkClass = variant === "nav" ? "text-2xl leading-none" : "text-xl leading-none";

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 no-underline" aria-label="Am-M home">
      <Image
        src="/brand/peanut-logo.svg"
        alt=""
        width={Math.round(logoHeight * 0.78)}
        height={logoHeight}
        className="shrink-0 object-contain"
        style={{ height: logoHeight, width: "auto" }}
        priority={variant === "nav"}
      />
      <span
        className={`font-display font-extrabold tracking-tight ${wordmarkClass} ${invert ? "text-bone" : "text-ink"}`}
      >
        Am-M
      </span>
      {showTagline ? (
        <span className="ml-2 hidden font-mono text-[13px] text-oat sm:inline">
          Hire a DeFi agent. You keep the keys.
        </span>
      ) : null}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-ink bg-buttercream">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-6">
        <BrandLockup />
        <div className="flex items-center gap-6 sm:gap-8">
          <HeaderNav />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="w-full border-t-2 border-ink bg-ink py-10 text-bone">
      <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <BrandLockup variant="footer" showTagline />
        <div className="flex items-center gap-6 font-mono text-sm">
          <Link href="/report" className="text-bone/80 transition-colors hover:text-bone">
            Report
          </Link>
          <a
            href="https://8004scan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone/80 transition-colors hover:text-bone"
          >
            8004scan
          </a>
          <a
            href="https://testnet.bscscan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone/80 transition-colors hover:text-bone"
          >
            BscScan testnet
          </a>
        </div>
        <div className="font-mono text-[11px] text-oat/80">© 2026 Am-M</div>
      </div>
    </footer>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-buttercream text-ink">
      <SiteHeader />
      <div className="flex-1 pt-16">{children}</div>
      <SiteFooter />
    </div>
  );
}

/** @deprecated Use AppLayout */
export const AppShell = AppLayout;
