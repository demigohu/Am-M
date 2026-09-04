"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "../ui/CopyButton";
import { Icon } from "../ui/Icon";
import { ALTANA_EXPLORER, urlBscAddress, urlBscTx } from "../../lib/altana/chain";
import { getHire, remainingLabel, type StoredHire } from "../../lib/altana/storage";
import { formatU, shortAddress } from "../../lib/format";
import { agentById, deskOf } from "../../lib/catalog";

export function JobView({ jobId }: { jobId: string }) {
  const [hire, setHire] = useState<StoredHire | null | undefined>(undefined);

  useEffect(() => {
    setHire(getHire(jobId) ?? null);
  }, [jobId]);

  if (hire === undefined) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 lg:px-10">
        <p className="font-mono text-[13px] text-char">Loading order…</p>
      </main>
    );
  }

  if (!hire) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 lg:px-10">
        <h1 className="mb-4 font-display text-4xl font-extrabold tracking-tight">
          Order #{jobId} not on this device
        </h1>
        <p className="mb-6 text-char">
          Hires are stored in this browser after a passkey grant. If you granted on another device,
          open Account on that device instead.
        </p>
        <Link href="/account" className="font-bold underline">
          Return to Account
        </Link>
      </main>
    );
  }

  const agent = agentById(hire.agentId);
  const desk = agent ? deskOf(agent) : null;
  const tx = hire.transactionHash;

  return (
    <main className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 lg:px-10">
      <Link href="/account" className="mb-6 inline-flex items-center gap-2 text-[15px] font-medium hover:underline">
        <Icon name="arrow_back" /> Account / {jobId}
      </Link>
      <div className="mb-2 font-mono text-[13px] text-char">BNB TESTNET (CHAIN_ID: 97)</div>
      <div className="mb-4 font-mono text-[13px] tracking-wider uppercase">
        Job / session
      </div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Job #{jobId}: {agent?.name ?? hire.agentId}
        </h1>
        <span className="rounded-full border border-ink bg-marigold px-4 py-1 text-sm font-bold">
          {hire.status === "revoked" ? "REVOKED" : "GRANTED"}
        </span>
      </div>
      <p className="mb-8 text-char">
        Session for {desk ? `${desk.name}` : hire.desk}. Optional ERC-8183 retainer is recorded
        separately when the vault holds $U.
      </p>

      <section className="mb-8 rounded-[20px] border-2 border-ink bg-bone p-6">
        <div className="mb-4 text-sm font-bold tracking-wider uppercase">Status</div>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(
            [
              ["check", "1. Funded", "Vault had gas for the grant"],
              ["hourglass_top", "2. Granted", "Keystore session registered"],
              ["key", "3. Ticking", hire.erc8183JobId ? `8183 job ${hire.erc8183JobId}` : "Seller may tick"],
            ] as const
          ).map(([icon, title, hint]) => (
            <li key={title} className="flex items-start gap-3 rounded-xl border border-ink bg-surface p-4">
              <Icon name={icon} />
              <div>
                <div className="font-bold">{title}</div>
                <div className="text-[13px] text-char">{hint}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8 rounded-[20px] border-2 border-ink bg-bone p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold">Grant Transaction</div>
          {tx ? (
            <div className="flex items-center gap-2">
              <CopyButton value={tx} />
              <a
                href={urlBscTx(tx)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm underline"
              >
                <Icon name="open_in_new" /> BscScan
              </a>
              <a
                href={ALTANA_EXPLORER}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm underline"
              >
                Altana
              </a>
            </div>
          ) : null}
        </div>
        <div className="mb-4 overflow-x-auto font-mono text-sm">{tx ?? "Relay confirmed without a hash."}</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <div className="text-[13px] text-char">Session</div>
            <div className="font-mono text-lg font-medium">{remainingLabel(hire.expiry)}</div>
            <div className="text-[13px] text-[#7e775f]">30-day expiry</div>
          </div>
          <div>
            <div className="text-[13px] text-char">Retainer</div>
            <div className="font-mono text-lg font-medium">
              {agent ? `${formatU(agent.priceWei)} $U` : "—"}
            </div>
            <div className="text-[13px] text-[#7e775f]">
              {hire.erc8183JobId ? `Job ${hire.erc8183JobId}` : "Session-only if $U was empty"}
            </div>
          </div>
          <div>
            <div className="text-[13px] text-char">Vault</div>
            <div className="font-mono text-lg font-medium">
              <a
                className="underline"
                href={urlBscAddress(hire.walletAddress)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {shortAddress(hire.walletAddress)}
              </a>
            </div>
            <div className="text-[13px] text-[#7e775f]">Passkey admin</div>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-[20px] border-2 border-ink bg-bone p-6">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="verified_user" />
          <h2 className="font-display text-2xl font-medium">Session</h2>
        </div>
        <p className="mb-4 text-sm text-char">
          {desk?.name ?? hire.desk} · {agent?.name ?? hire.agentId}
        </p>
        <p className="mb-4 font-mono text-sm">
          Session key {shortAddress(hire.publicKey)}
        </p>
        <p className="mb-6 text-char">Allowlist, spend cap, and expiry are on-chain. Revoke from Account.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/account"
            className="rounded-full border border-ink bg-bone px-5 py-2 text-sm font-bold hover:bg-buttercream"
          >
            Account
          </Link>
          <Link
            href="/market"
            className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-marigold px-5 py-2 text-sm font-bold hover:bg-marigold-dim"
          >
            Hire another <Icon name="add_circle" />
          </Link>
        </div>
      </section>
    </main>
  );
}
