"use client";

import { CopyButton } from "../ui/CopyButton";
import { Icon } from "../ui/Icon";
import { FAUCET_TBNB, FAUCET_U } from "../../lib/altana/chain";
import type { VaultBalances } from "../../lib/altana/balances";

export function AccountDepositCard({
  address,
  balances,
  funded,
  expanded,
  onToggle,
}: {
  address: string;
  balances: VaultBalances | null;
  funded: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=${encodeURIComponent(address)}`;

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-bone p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink pb-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Icon name="account_balance_wallet" className="text-marigold" />
            <h2 className="font-display text-xl font-medium">Add funds</h2>
            {!funded ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-status-red/10 px-2 py-0.5 font-mono text-[11px] font-bold text-status-red">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-red" />
                Needs tBNB
              </span>
            ) : null}
          </div>
          <p className="text-[13px] text-char">
            Send tBNB to this address from a faucet or any wallet. MetaMask can deposit here — it
            cannot log you in.
          </p>
        </div>
        {funded ? (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-full border border-ink bg-bone px-3 py-1.5 text-sm font-bold hover:bg-[#f7eeca]"
          >
            {expanded ? "Hide" : "Show address"}
            <Icon name={expanded ? "expand_less" : "expand_more"} className="text-base" />
          </button>
        ) : null}
      </div>

      {!funded || expanded ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-ink bg-buttercream p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="Deposit address QR code"
                width={144}
                height={144}
                className="rounded-lg border border-ink bg-white"
              />
              <span className="font-mono text-[10px] text-char uppercase">Scan to deposit</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1.5 rounded-xl bg-[#fdf4d0] p-3">
                <span className="font-mono text-[11px] tracking-wider text-char uppercase">
                  Your account address
                </span>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-bone p-2 px-3">
                  <span className="truncate font-mono text-sm tabular-nums select-all">{address}</span>
                  <CopyButton value={address} />
                </div>
                <p className="font-mono text-[11px] text-char">
                  Balance: {balances?.nativeLabel ?? "0.0000"} tBNB · BNB Chain testnet
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-ink/15 pt-4">
            <a
              href={FAUCET_TBNB}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-bone px-4 py-2 text-sm font-medium hover:bg-[#f7eeca]"
            >
              tBNB faucet <span className="font-mono">↗</span>
            </a>
            <a
              href={FAUCET_U}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-bone px-4 py-2 text-sm font-medium hover:bg-[#f7eeca]"
            >
              $U faucet <span className="font-mono">↗</span>
            </a>
          </div>

          {!funded ? (
            <div className="flex items-start gap-3 rounded-xl bg-[#f7eeca] p-4">
              <div className="relative mt-1">
                <span className="absolute inline-flex h-3.5 w-3.5 animate-ping rounded-full bg-status-green opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-green" />
              </div>
              <div>
                <p className="text-[15px] font-bold">Waiting for deposit…</p>
                <p className="text-[13px] text-char">
                  ~0.05 tBNB covers hire + agent ticks. Checking every 4 seconds.
                </p>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-[13px] text-char">
          Current gas reserve: <strong className="text-ink">{balances?.nativeLabel ?? "—"} tBNB</strong>
        </p>
      )}
    </section>
  );
}
