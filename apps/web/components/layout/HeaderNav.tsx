"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const marketPaths = ["/market", "/agents", "/hire", "/jobs"];

function isActive(pathname: string, href: string) {
  if (href === "/market") {
    return marketPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const active = isActive(pathname, href);
    return (
      <Link
        href={href}
        className={`text-[15px] transition-colors ${
          active
            ? "border-b-2 border-ink pb-1 font-bold text-ink"
            : "font-bold text-char hover:text-ink"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav className="hidden items-center gap-8 sm:flex">
        {navLink("/market", "Market")}
      </nav>
      <Link
        href="/account"
        className="inline-flex items-center justify-center rounded-full border-2 border-ink bg-bone px-4 py-1.5 font-mono text-sm text-ink transition-colors hover:bg-buttercream"
      >
        Account
      </Link>
    </>
  );
}
