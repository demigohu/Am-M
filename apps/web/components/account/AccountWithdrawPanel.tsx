"use client";

import { Icon } from "../ui/Icon";
import type { OpenPosition } from "../../lib/altana/positions";

export function AccountWithdrawPanel({
  positions,
  busy,
  funded,
  onWithdraw,
}: {
  positions: OpenPosition[];
  busy: boolean;
  funded: boolean;
  onWithdraw: () => Promise<void>;
}) {
  const hasPositions = positions.length > 0;

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-bone p-6">
      <div className="border-b border-ink pb-4">
        <div className="flex items-center gap-2">
          <Icon name="logout" className="text-marigold" />
          <h2 className="font-display text-xl font-medium">Close positions</h2>
        </div>
        <p className="mt-1 text-[13px] text-char">
          Withdraw from Venus or PancakeSwap positions opened inside your account. Tokens return to
          this wallet — not to MetaMask unless you send them.
        </p>
      </div>

      {hasPositions ? (
        <ul className="space-y-2">
          {positions.map((pos) => (
            <li
              key={pos.kind === "venus" ? pos.vToken : pos.tokenId.toString()}
              className="flex items-center gap-2 rounded-xl border border-ink bg-[#fdf4d0] px-3 py-2 font-mono text-[11px]"
            >
              <Icon
                name={pos.kind === "venus" ? "savings" : "water_drop"}
                className="text-base text-char"
              />
              <span>{pos.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-ink bg-buttercream p-4 text-[13px] text-char">
          No open Venus or PancakeSwap positions detected. Hire an agent to open one, or your funds
          are already liquid in this account.
        </p>
      )}

      <button
        type="button"
        disabled={busy || !funded || !hasPositions}
        onClick={() => void onWithdraw()}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-marigold text-sm font-bold transition-all hover:bg-marigold-dim active:translate-y-px disabled:opacity-50"
      >
        <Icon name="fingerprint" />
        {busy ? "Closing positions…" : "Close all & withdraw"}
      </button>
    </section>
  );
}
