"use client";

import {
  DEFAULT_LEASE_DAYS,
  LEASE_PRESETS,
  SPEND_CAP_PRESETS,
  type SessionBudgetInput,
} from "../../lib/altana/sessionBudget";

export function SessionBudgetControls({
  value,
  onChange,
}: {
  value: SessionBudgetInput;
  onChange: (next: SessionBudgetInput) => void;
}) {
  const customStable = !SPEND_CAP_PRESETS.includes(
    value.stableDailyCap as (typeof SPEND_CAP_PRESETS)[number],
  );
  const customLease = !LEASE_PRESETS.includes(
    value.leaseDays as (typeof LEASE_PRESETS)[number],
  );

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-bold">Daily spend cap</label>
        <p className="mb-3 text-[13px] text-char">
          How much USDT/USDC (and matching WBNB cap) this agent may move per day.
        </p>
        <div className="flex flex-wrap gap-2">
          {SPEND_CAP_PRESETS.map((cap) => (
            <button
              key={cap}
              type="button"
              onClick={() => onChange({ ...value, stableDailyCap: cap })}
              className={`rounded-full border border-ink px-3 py-1.5 font-mono text-[11px] font-bold ${
                value.stableDailyCap === cap && !customStable
                  ? "bg-marigold"
                  : "bg-bone hover:bg-buttercream"
              }`}
            >
              {cap} USDT
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                stableDailyCap: customStable ? value.stableDailyCap : 250,
              })
            }
            className={`rounded-full border border-ink px-3 py-1.5 font-mono text-[11px] font-bold ${
              customStable ? "bg-marigold" : "bg-bone hover:bg-buttercream"
            }`}
          >
            Custom
          </button>
        </div>
        {customStable ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100_000}
              value={value.stableDailyCap}
              onChange={(e) =>
                onChange({
                  ...value,
                  stableDailyCap: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-28 rounded-lg border border-ink bg-bone px-3 py-2 font-mono text-sm"
            />
            <span className="font-mono text-[11px] text-char">USDT/USDC per day</span>
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold">Lease duration</label>
        <p className="mb-3 text-[13px] text-char">
          Session expiry — revoke anytime from Account before this date.
        </p>
        <div className="flex flex-wrap gap-2">
          {LEASE_PRESETS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onChange({ ...value, leaseDays: days })}
              className={`rounded-full border border-ink px-3 py-1.5 font-mono text-[11px] font-bold ${
                value.leaseDays === days && !customLease
                  ? "bg-marigold"
                  : "bg-bone hover:bg-buttercream"
              }`}
            >
              {days}d
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                leaseDays: customLease ? value.leaseDays : 60,
              })
            }
            className={`rounded-full border border-ink px-3 py-1.5 font-mono text-[11px] font-bold ${
              customLease ? "bg-marigold" : "bg-bone hover:bg-buttercream"
            }`}
          >
            Custom
          </button>
        </div>
        {customLease ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              value={value.leaseDays}
              onChange={(e) =>
                onChange({
                  ...value,
                  leaseDays: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-20 rounded-lg border border-ink bg-bone px-3 py-2 font-mono text-sm"
            />
            <span className="font-mono text-[11px] text-char">days</span>
          </div>
        ) : null}
      </div>

      <p className="rounded-lg border border-ink bg-bone p-3 text-[12px] text-char">
        Native cap fixed at <strong>0.1 tBNB/day</strong>. Allowlist is desk-defined — users
        cannot toggle individual contract calls.
      </p>
    </div>
  );
}
