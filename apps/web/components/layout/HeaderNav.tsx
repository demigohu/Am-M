"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../ui/Icon";

const marketPaths = ["/market", "/desks", "/agents", "/hire", "/jobs"];

function isActive(pathname: string, href: string) {
  if (href === "/market") {
    return marketPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-6">
      <nav className="flex items-center gap-6 md:gap-8">
        <Link
          href="/#how-it-works"
          className="hidden text-[15px] text-ink underline-offset-4 hover:underline md:inline"
        >
          How it works
        </Link>
        <Link
          href="/report"
          className={`hidden text-[15px] text-ink underline-offset-4 hover:underline md:inline ${
            isActive(pathname, "/report") ? "font-bold underline decoration-2" : ""
          }`}
        >
          Report
        </Link>
        <Link
          href="/market"
          className={`text-[15px] text-ink underline-offset-4 hover:underline ${
            isActive(pathname, "/market") ? "font-bold underline decoration-2" : ""
          }`}
        >
          Market
        </Link>
      </nav>
      <Link
        href="/account"
        aria-label="Account"
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-ink ${
          isActive(pathname, "/account")
            ? "bg-ink text-bone"
            : "bg-[#6f5d00] text-white hover:bg-ink"
        }`}
      >
        <Icon name="person" className="text-[18px]" />
      </Link>
    </div>
  );
}
