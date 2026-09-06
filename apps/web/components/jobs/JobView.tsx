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
import { formatNetYieldLabel, formatGasSpent } from "../../lib/indexer-format";
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
  erc8183JobId?: string | null;
  status: string;
  wallet: string;
  keys: { keyId: string; valid: boolean; expiry: string }[];
  executions: IndexerExecution[];
  snapshots: { takenAt: string; vUsdtUnderlying: string; vUsdcUnderlying: string; vBnbUnderlying: string }[];
  payments: { txHash: string; value: string }[];
  metrics?: {
    strategyTxCount: number;
    executionCount: number;
    positionSummary: string | null;
    netYieldUsdt: string;
    gasSpentWei: string;
  };
  erc8183?: {
    status: string;
    deliverableUrl: string | null;
    deliverableHash: string | null;
    jobId: string;
  } | null;
  deliverable?: {
    summary: string | null;
    payload: unknown;
  } | null;
};

function formatUnderlying(raw: string | undefined): string | null {
  if (!raw || raw === "0") return null;
  try {
    const v = BigInt(raw);
    if (v === 0n) return null;
    for (const decimals of [18, 6]) {
      const n = Number(v) / 10 ** decimals;
      if (Number.isFinite(n) && n >= 0.0001) {
        return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
      }
    }
    return null;
  } catch {
    return null;
  }
}

function snapshotSummary(snapshots: IndexerJob["snapshots"]): string | null {
  const latest = snapshots[0];
  if (!latest) return null;
  const usdt = formatUnderlying(latest.vUsdtUnderlying);
  const usdc = formatUnderlying(latest.vUsdcUnderlying);
  const bnb = formatUnderlying(latest.vBnbUnderlying);
  const parts: string[] = [];
  if (usdt) parts.push(`${usdt} USDT in Venus`);
  if (usdc) parts.push(`${usdc} USDC in Venus`);
  if (bnb) parts.push(`${bnb} BNB in Venus`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function hasPositionEvidence(snapshots: IndexerJob["snapshots"]): boolean {
  return snapshotSummary(snapshots) !== null;
}

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
  const positionSummary = indexed?.snapshots ? snapshotSummary(indexed.snapshots) : null;
  const positionDetected = indexed?.snapshots ? hasPositionEvidence(indexed.snapshots) : false;
  const onIndexer = Boolean(indexed);
  const keyId = altanaKeyId(hire.publicKey);
  const keyRegistered =
    hire.status === "revoked" ? false : sessionKey ? sessionKey.valid : true;
  const erc8183JobId = hire.erc8183JobId ?? indexed?.erc8183JobId ?? indexed?.erc8183?.jobId ?? null;
  const erc8183Status = indexed?.erc8183?.status ?? null;
  const deliverableUrl = indexed?.erc8183?.deliverableUrl ?? null;
  const deskDeliverable = indexed?.deliverable?.summary ?? null;
  const statusLabel =
    hire.status === "revoked"
      ? "REVOKED"
      : erc8183Status
        ? erc8183Status
        : erc8183JobId
          ? "FUNDED"
          : "SESSION ACTIVE";
  const strategyTxCount =
    indexed?.metrics?.strategyTxCount ??
    (indexed?.executions ? new Set(indexed.executions.map((e) => e.txHash)).size : 0);
  const netYieldLabel = formatNetYieldLabel(indexed?.metrics?.netYieldUsdt, "USDT");
  const gasLabel = formatGasSpent(indexed?.metrics?.gasSpentWei);

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
              {erc8183JobId ? `ERC-8183 job ${erc8183JobId}` : "Session grant only"}
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
                ? `${formatU(agent.priceWei)} $U${erc8183JobId ? " · paid via ERC-8183" : " · session-only if $U empty"}`
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
                {strategyTxCount} strategy tx{strategyTxCount === 1 ? "" : "s"} indexed for this session
                {netYieldLabel ? ` · net yield ${netYieldLabel}` : ""}
                {gasLabel ? ` · gas ${gasLabel}` : ""}.
              </p>
            </>
          ) : onIndexer ? (
            <div className="rounded-xl border border-ink bg-buttercream p-4">
              {positionDetected ? (
                <>
                  <p className="font-mono text-[11px] font-bold uppercase text-status-green">
                    Position detected on-chain
                  </p>
                  <p className="mt-2 text-[13px] text-ink">
                    <strong>{positionSummary}</strong>
                  </p>
                  <p className="mt-2 text-[13px] text-char">
                    The indexer reads Venus balances directly — this usually means the agent already
                    opened or adjusted a position. Tx hashes are a separate scan and may lag after a
                    schema reset.
                  </p>
                </>
              ) : (
                <p className="font-mono text-[11px] font-bold uppercase text-char">
                  No Venus / Pancake position detected yet
                </p>
              )}
              <ul className="mt-3 space-y-1.5 text-[13px] text-char">
                <li>
                  · Keystore key is{" "}
                  <strong className="text-ink">{sessionKey?.valid ? "valid" : "revoked"}</strong>.
                </li>
                {snapshotCount > 0 ? (
                  <li>
                    · <strong className="text-ink">{snapshotCount}</strong> position snapshot
                    {snapshotCount === 1 ? "" : "s"} recorded.
                  </li>
                ) : null}
                <li>
                  · <strong className="text-ink">{strategyTxCount}</strong> strategy tx
                  {strategyTxCount === 1 ? "" : "s"} in the execution log (transfers + contract calls).
                </li>
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
              {deskDeliverable ? (
                <p className="mt-2 text-[13px]">
                  Agent snapshot: <strong className="text-ink">{deskDeliverable}</strong>
                </p>
              ) : null}
              {erc8183JobId ? (
                <div className="mt-2 space-y-1 font-mono text-[11px] text-char">
                  <p>
                    ERC-8183 job {erc8183JobId}
                    {erc8183Status ? ` · ${erc8183Status}` : ""}
                  </p>
                  {deliverableUrl ? (
                    <a
                      href={deliverableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-ink underline"
                    >
                      Open deliverable manifest
                    </a>
                  ) : (
                    <p>
                      Manifest URL: <strong className="text-ink">awaiting agent submit</strong>
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-ink bg-[#f7eeca] p-4">
              <p className="font-mono text-[11px] font-semibold uppercase">
                {positionDetected || deskDeliverable ? "Position live · tx log catching up" : "Not indexed yet"}
              </p>
              {positionDetected ? (
                <p className="mt-2 text-[13px]">
                  On-chain position: <strong>{positionSummary}</strong>
                </p>
              ) : null}
              {deskDeliverable ? (
                <p className="mt-2 text-[13px]">
                  Agent snapshot: <strong>{deskDeliverable}</strong>
                </p>
              ) : null}
              <p className="mt-2 text-[13px] text-char">{deliverableExpectation(desk?.slug)}</p>
              {erc8183JobId ? (
                <div className="mt-2 space-y-1 font-mono text-[11px] text-char">
                  <p>
                    ERC-8183 job {erc8183JobId}
                    {erc8183Status ? ` · ${erc8183Status}` : ""}
                  </p>
                  {deliverableUrl ? (
                    <a
                      href={deliverableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-ink underline"
                    >
                      Open deliverable manifest
                    </a>
                  ) : (
                    <p>Deliverable manifest will link here once submitted.</p>
                  )}
                </div>
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
