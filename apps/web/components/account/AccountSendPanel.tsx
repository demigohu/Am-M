"use client";

import { useState } from "react";
import { Icon } from "../ui/Icon";
import type { VaultBalances } from "../../lib/altana/balances";
import {
  assertSendWithinBalance,
  parseSendAmount,
  sendAssetLabel,
  validateSendRecipient,
  type SendAsset,
} from "../../lib/altana/send";

const ASSETS: SendAsset[] = ["tBNB", "USDT", "USDC", "U"];

export function AccountSendPanel({
  balances,
  busy,
  onSend,
}: {
  balances: VaultBalances | null;
  busy: boolean;
  onSend: (asset: SendAsset, to: string, amount: string) => Promise<void>;
}) {
  const [asset, setAsset] = useState<SendAsset>("tBNB");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit() {
    setLocalError(null);
    try {
      const recipient = validateSendRecipient(to);
      const parsed = parseSendAmount(asset, amount);
      if (!balances) throw new Error("Balances not loaded yet.");
      assertSendWithinBalance(asset, parsed, balances);
      await onSend(asset, recipient, amount);
      setAmount("");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err));
    }
  }

  function maxHint(): string {
    if (!balances) return "—";
    if (asset === "tBNB") {
      const reserve = 0.02;
      const n = Math.max(0, Number(balances.nativeLabel) - reserve);
      return n.toFixed(4);
    }
    if (asset === "USDT") return balances.usdtLabel;
    if (asset === "USDC") return balances.usdcLabel;
    return balances.uLabel;
  }

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-bone p-6">
      <div className="border-b border-ink pb-4">
        <div className="flex items-center gap-2">
          <Icon name="send" className="text-marigold" />
          <h2 className="font-display text-xl font-medium">Send</h2>
        </div>
        <p className="mt-1 text-[13px] text-char">
          You control this account with your passkey. Agents cannot send funds out — only you can.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] tracking-wider text-char uppercase">Token</span>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value as SendAsset)}
            className="rounded-2xl border-[1.5px] border-ink bg-buttercream px-4 py-3 font-mono text-sm outline-none"
          >
            {ASSETS.map((a) => (
              <option key={a} value={a}>
                {sendAssetLabel(a)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] tracking-wider text-char uppercase">Amount</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-2xl border-[1.5px] border-ink bg-buttercream px-4 py-3 font-mono text-sm tabular-nums outline-none"
          />
          <span className="font-mono text-[10px] text-char">Available: {maxHint()} {sendAssetLabel(asset)}</span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] tracking-wider text-char uppercase">To address</span>
        <input
          type="text"
          placeholder="0x…"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-2xl border-[1.5px] border-ink bg-buttercream px-4 py-3 font-mono text-sm outline-none"
        />
      </label>

      {localError ? (
        <p className="rounded-xl border border-ink bg-buttercream p-3 text-sm text-status-red">{localError}</p>
      ) : null}

      <button
        type="button"
        disabled={busy || !balances?.funded}
        onClick={() => void submit()}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-marigold text-sm font-bold transition-all hover:bg-marigold-dim active:translate-y-px disabled:opacity-50"
      >
        <Icon name="fingerprint" />
        {busy ? "Waiting for passkey…" : "Send with passkey"}
      </button>
    </section>
  );
}
