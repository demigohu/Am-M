"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "../ui/CopyButton";
import { Icon } from "../ui/Icon";
import { urlAltanaKey, urlBscAddress, urlBscTx } from "../../lib/altana/chain";
import { altanaKeyId } from "../../lib/altana/keystore";
import { getHire, remainingLabel, type StoredHire } from "../../lib/altana/storage";
import { formatU, shortAddress } from "../../lib/format";
import { agentById, deskOf, type DeskSlug } from "../../lib/catalog";
import { DESK_HEX } from "../../lib/stitch-styles";

type IndexerExecution = {
  txHash: string;
  target: string;
  recipientsVerified: boolean;
  timestamp: string;
};

type IndexerJob = {
  grantTx: string | null;
  status: string;
  wallet: string;
  keys: { keyId: string; valid: boolean; expiry: string }[];
  executions: IndexerExecution[];
  snapshots: { takenAt: string; vUsdtUnderlying: string; vUsdcUnderlying: string; vBnbUnderlying: string }[];
  payments: { txHash: string; value: string }[];
};

function deliverableExpectation(desk: DeskSlug | undefined): string {
  switch (desk) {
    case "rebalance":
      return "LP range changes, collected fees, and in-range time — each backed by strategy tx hashes.";
    case "grid":
      return "Grid fills, inventory, realized PnL, win rate, and drawdown over the session window.";
    case "yield":
      return "vToken start → end migration, APR realized vs quoted, and the tx that moved supply.";
    case "guard":
      return "Health factor timeline and on-chain rescue tx hashes (repay/supply), not alerts.";
    default:
      return "Agent strategy output verified by on-chain tx hashes from this session.";
  }
}

export function JobView({ jobId }: { jobId: string }) {
  const [hire, setHire] = useState<StoredHire | null | undefined>(undefined);
  const [indexed, setIndexed] = useState<IndexerJob | null>(null);
  const [indexLoaded, setIndexLoaded] = useState(false);

  useEffect(() => {
    setHire(getHire(jobId) ?? null);
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/jobs/${encodeURIComponent(jobId)}`)
      .then((res) => res.json())
      .then((body: { indexed?: boolean; job?: IndexerJob | null }) => {
        if (cancelled) return;
        setIndexed(body.indexed && body.job ? body.job : null);
      })
      .catch(() => {
        if (!cancelled) setIndexed(null);
      })
      .finally(() => {
        if (!cancelled) setIndexLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (hire === undefined) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-12">
        <p className="font-mono text-[13px] text-char">Loading order…</p>
      </div>
    );
  }

  if (!hire) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-12">
        <h1 className="mb-4 font-display text-4xl font-extrabold tracking-tight">
          Job #{jobId} not on this device
        </h1>
        <p className="mb-6 text-char">
          Hires are stored in this browser after a passkey grant. If you granted on another device,
          open Account on that device instead.
        </p>
        <Link href="/account" className="font-bold underline">
          Return to Account
        </Link>
      </div>
    );
  }

  const agent = agentById(hire.agentId);
  const desk = agent ? deskOf(agent) : null;
  const hex = desk ? DESK_HEX[desk.slug] : "#4a63c4";
  const grantTx = hire.transactionHash ?? indexed?.grantTx ?? null;
  const latestExecution = indexed?.executions?.[0] ?? null;
  const sessionKey = indexed?.keys?.[0] ?? null;
  const snapshotCount = indexed?.snapshots?.length ?? 0;
  const onIndexer = Boolean(indexed);
  const keyId = altanaKeyId(hire.publicKey);
  const keyRegistered =
    hire.status === "revoked" ? false : sessionKey ? sessionKey.valid : true;
  const statusLabel =
    hire.status === "revoked" ? "REVOKED" : hire.erc8183JobId ? "FUNDED" : "SESSION ACTIVE";

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-8 sm:py-12">
      <Link
        href="/account"
        className="group inline-flex items-center gap-1.5 text-[15px] transition-colors hover:text-char"
      >
        <Icon name="arrow_back" className="transition-transform group-hover:-translate-x-1" />
        Back to Account
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-ink bg-[#f7eeca] px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wider uppercase">
            Job ticket // #{jobId}
          </span>
          {desk ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase"
              style={{ color: hex, backgroundColor: `${hex}26` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
              {desk.name}
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Job ticket</h1>
        <p className="text-[15px] leading-relaxed text-char">
          Hire receipt for {agent?.name ?? hire.agentId}. Session grant proves permission; agent
          deliverable is separate strategy output on-chain.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-[20px] border-2 border-ink bg-bone p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-3 border-b border-ink pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-full border border-ink px-3.5 py-1 ${
                hire.status === "revoked"
                  ? "bg-oat text-char"
                  : "bg-status-green/10 text-status-green"
              }`}
            >
              {hire.status !== "revoked" ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-status-green" />
              ) : null}
              <span className="font-mono text-sm font-semibold tracking-wider uppercase">{statusLabel}</span>
            </div>
            <span className="text-[13px] text-char">
              {hire.erc8183JobId ? `ERC-8183 job ${hire.erc8183JobId}` : "Session grant only"}
            </span>
          </div>
          <span className="font-mono text-[11px] text-char">{remainingLabel(hire.expiry)}</span>
        </div>

        <ProofBlock
          title="1 · Session grant"
          subtitle="Passkey signed Keystore registration on BscScan · session key status on Altana."
        >
          <Row label="Target agent" value={agent?.name ?? hire.agentId} badge={desk?.code} />
          <Row
            label="Altana session key"
            value={
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase ${
                    keyRegistered ? "bg-status-green/10 text-status-green" : "bg-oat text-char"
                  }`}
                >
                  {keyRegistered ? "Registered" : "Revoked"}
                </span>
                <ExplorerLink href={urlAltanaKey(keyId)} label="View key on Altana" />
                <span className="font-mono text-[10px] text-char">{shortAddress(keyId)}</span>
              </div>
            }
          />
          <Row
            label="Grant tx"
            value={
              grantTx ? (
                <TxLinks hash={grantTx} />
              ) : (
                "Not recorded on this device"
              )
            }
          />
          <Row label="Session public key" value={shortAddress(hire.publicKey)} />
          {onIndexer ? (
            <Row
              label="Indexer · session"
              value={
                <span className="text-status-green">
                  Stored · key {sessionKey?.valid ? "valid" : "invalid/revoked"}
                </span>
              }
            />
          ) : indexLoaded ? (
            <Row label="Indexer · session" value="Not found on indexer VPS" />
          ) : null}
          <Row
            label="Vault"
            value={
              <a className="underline" href={urlBscAddress(hire.walletAddress)} target="_blank" rel="noopener noreferrer">
                {shortAddress(hire.walletAddress)}
              </a>
            }
          />
          <Row
            label="Retainer"
            value={
              agent
                ? `${formatU(agent.priceWei)} $U${hire.erc8183JobId ? " · paid via ERC-8183" : " · session-only if $U empty"}`
                : "—"
            }
          />
        </ProofBlock>

        <ProofBlock
          title="2 · Agent work"
          subtitle="Strategy txs from the agent — indexed from BscScan, not Altana tx pages."
        >
          {!indexLoaded ? (
            <p className="font-mono text-[11px] text-char">Checking indexer…</p>
          ) : latestExecution ? (
            <>
              <Row label="Latest strategy tx" value={<TxLinks hash={latestExecution.txHash} />} />
              <Row
                label="Recipients verified"
                value={latestExecution.recipientsVerified ? "Yes — stayed in your vault" : "Review on BscScan"}
              />
              <p className="font-mono text-[11px] text-char">
                {indexed!.executions.length} ERC-20 transfer tx
                {indexed!.executions.length === 1 ? "" : "s"} indexed for this session.
              </p>
            </>
          ) : onIndexer ? (
            <div className="rounded-xl border border-ink bg-buttercream p-4">
              <p className="font-mono text-[11px] font-bold uppercase text-char">
                No strategy tx indexed yet
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-char">
                <li>
                  · Session is on the indexer; Keystore key is{" "}
                  <strong className="text-ink">{sessionKey?.valid ? "valid" : "revoked"}</strong>.
                </li>
                {snapshotCount > 0 ? (
                  <li>
                    · <strong className="text-ink">{snapshotCount}</strong> Venus position snapshot
                    {snapshotCount === 1 ? "" : "s"} recorded (underlying balances over time).
                  </li>
                ) : null}
                <li>
                  · <strong className="text-ink">0</strong> agent execution txs — indexer only
                  captures USDT / USDC / WBNB / $U transfers touching your vault during agent ticks.
                </li>
                <li>· Agent may not have ticked yet, or its tx did not emit a tracked token transfer.</li>
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-ink bg-buttercream p-4">
              <p className="font-mono text-[11px] font-bold uppercase text-char">Session not on indexer</p>
              <p className="mt-2 text-[13px] text-char">
                Hire was saved in this browser but not posted to the VPS indexer (or used a different job id).
                Grant tx on BscScan above is still valid proof of permission.
              </p>
            </div>
          )}
        </ProofBlock>

        <ProofBlock
          title="3 · Deliverable"
          subtitle="What the agent owes you — not the grant tx."
        >
          {latestExecution ? (
            <div className="rounded-xl border border-ink bg-[#f7eeca] p-4">
              <p className="font-mono text-[11px] font-semibold uppercase">Strategy output (partial)</p>
              <p className="mt-2 text-[13px]">
                Latest on-chain action:{" "}
                <a
                  href={urlBscTx(latestExecution.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold underline"
                >
                  {shortAddress(latestExecution.txHash)}
                </a>
              </p>
              <p className="mt-2 text-[13px] text-char">{deliverableExpectation(desk?.slug)}</p>
              {hire.erc8183JobId ? (
                <p className="mt-2 font-mono text-[11px] text-char">
                  Full ERC-8183 manifest URL: <strong className="text-ink">Not indexed yet</strong>
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-ink bg-[#f7eeca] p-4">
              <p className="font-mono text-[11px] font-semibold uppercase">Not indexed yet</p>
              <p className="mt-2 text-[13px] text-char">{deliverableExpectation(desk?.slug)}</p>
              {hire.erc8183JobId ? (
                <p className="mt-2 font-mono text-[11px] text-char">
                  ERC-8183 job {hire.erc8183JobId} — deliverable manifest will link here once submitted.
                </p>
              ) : null}
            </div>
          )}
        </ProofBlock>

        <div className="flex flex-col gap-3 border-t border-ink pt-4 sm:flex-row">
          <Link
            href="/account"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-marigold py-3 px-6 text-sm font-bold transition-all hover:bg-marigold-dim active:translate-y-px"
          >
            <Icon name="receipt_long" />
            View in Account
          </Link>
          <Link
            href="/market"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-bone py-3 px-5 text-sm font-bold transition-colors hover:bg-[#f7eeca]"
          >
            Hire another
          </Link>
        </div>
      </div>

      <p className="text-center font-mono text-[11px] tracking-wider text-char uppercase">
        Non-custodial session · Revoke from Account
      </p>
    </div>
  );
}

function ProofBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink bg-buttercream/40 p-4">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-[13px] text-char">{subtitle}</p>
      </div>
      <div className="flex flex-col divide-y divide-ink/30">{children}</div>
    </div>
  );
}

function TxLinks({ hash }: { hash: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded border border-ink/40 bg-[#f7eeca] px-2 py-0.5 font-mono text-sm">
        {shortAddress(hash)}
      </code>
      <CopyButton value={hash} />
      <ExplorerLink href={urlBscTx(hash)} label="BscScan" />
    </div>
  );
}

function ExplorerLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-sm font-bold hover:underline"
    >
      {label}
      <Icon name="north_east" className="text-[16px]" />
    </a>
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value: ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 text-[13px] sm:flex-row sm:items-center">
      <span className="text-char">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium">{value}</span>
        {badge ? (
          <span className="rounded-full border border-ink bg-[#f7eeca] px-2 py-0.5 font-mono text-[11px]">
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}
