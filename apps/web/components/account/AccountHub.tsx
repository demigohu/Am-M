"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyButton } from "../ui/CopyButton";
import { Icon } from "../ui/Icon";
import { AccountDepositCard } from "./AccountDepositCard";
import { AccountSendPanel } from "./AccountSendPanel";
import { AccountWithdrawPanel } from "./AccountWithdrawPanel";
import { readVault, type VaultBalances } from "../../lib/altana/balances";
import { altanaClient, errorMessage } from "../../lib/altana/client";
import { CHAIN_ID, EXPLORER } from "../../lib/altana/chain";
import { deleteSessionFile } from "../../lib/altana/persist";
import {
  buildWithdrawCalls,
  readOpenPositions,
  type OpenPosition,
} from "../../lib/altana/positions";
import { sleep } from "../../lib/altana/retry";
import {
  buildSendCall,
  parseSendAmount,
  validateSendRecipient,
  type SendAsset,
} from "../../lib/altana/send";
import {
  getStoredWallet,
  listHires,
  remainingLabel,
  sortHiresForDisplay,
  upsertHire,
  type StoredHire,
} from "../../lib/altana/storage";
import { formatU, shortAddress } from "../../lib/format";
import { createAccount, openWallet, recoverAccount } from "../../lib/altana/wallet";
import { AGENTS, DESKS } from "../../lib/catalog";
import { DESK_HEX } from "../../lib/stitch-styles";

type Phase = "boot" | "none" | "account";

export function AccountHub({ next }: { next: string }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<VaultBalances | null>(null);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [hires, setHires] = useState<StoredHire[]>([]);
  const [busy, setBusy] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [depositExpanded, setDepositExpanded] = useState(false);

  const refresh = useCallback(async (addr: `0x${string}`) => {
    const [vault, open] = await Promise.all([readVault(addr), readOpenPositions(addr)]);
    setBalances(vault);
    setPositions(open);
    setHires(
      sortHiresForDisplay(
        listHires().filter((h) => h.walletAddress.toLowerCase() === addr.toLowerCase()),
      ),
    );
    if (!vault.funded) setDepositExpanded(true);
  }, []);

  useEffect(() => {
    const stored = getStoredWallet();
    if (!stored) {
      setPhase("none");
      return;
    }
    setAddress(stored.address);
    setPhase("account");
    void refresh(stored.address).catch((err) => {
      setError(errorMessage(err));
    });
  }, [refresh]);

  useEffect(() => {
    if (phase !== "account" || !address) return;
    const tick = window.setInterval(() => {
      void refresh(address as `0x${string}`).catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(tick);
  }, [phase, address, refresh]);

  async function onCreate() {
    setBusy(true);
    setError(null);
    try {
      const opened = await createAccount();
      setAddress(opened.address);
      setPhase("account");
      await refresh(opened.address);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRecover() {
    setBusy(true);
    setError(null);
    try {
      const opened = await recoverAccount();
      setAddress(opened.address);
      setPhase("account");
      await refresh(opened.address);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(hire: StoredHire) {
    setRevoking(hire.id);
    setError(null);
    try {
      const opened = await openWallet();
      const client = altanaClient();
      const result = await client.revokeSession({
        wallet: opened.wallet,
        signer: opened.signer,
        session: hire.publicKey,
        chainId: CHAIN_ID,
      });
      if (result.status === "FAILED") {
        throw new Error("Revoke failed on-chain. Check the vault on BscScan.");
      }
      upsertHire({ ...hire, status: "revoked" });
      await deleteSessionFile(hire.id);
      await refresh(opened.address);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRevoking(null);
    }
  }

  async function onSend(asset: SendAsset, to: string, amount: string) {
    if (!address || !balances) return;
    setWalletBusy(true);
    setError(null);
    try {
      const opened = await openWallet();
      const recipient = validateSendRecipient(to);
      const parsed = parseSendAmount(asset, amount);
      const client = altanaClient();
      const result = await client.execute({
        wallet: opened.wallet,
        signer: opened.signer,
        chainId: CHAIN_ID,
        calls: [buildSendCall(asset, recipient, parsed)],
      });
      if (result.status === "FAILED") {
        throw new Error("Send failed on-chain. Check BscScan and retry.");
      }
      await sleep(3_000);
      await refresh(opened.address);
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setWalletBusy(false);
    }
  }

  async function onWithdraw() {
    if (!address || positions.length === 0) return;
    setWalletBusy(true);
    setError(null);
    try {
      const opened = await openWallet();
      const calls = buildWithdrawCalls(opened.address, positions);
      if (calls.length === 0) return;
      const client = altanaClient();
      const result = await client.execute({
        wallet: opened.wallet,
        signer: opened.signer,
        chainId: CHAIN_ID,
        calls,
      });
      if (result.status === "FAILED") {
        throw new Error("Withdraw failed on-chain. Check BscScan — active borrows may block redeem.");
      }
      await sleep(5_000);
      await refresh(opened.address);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setWalletBusy(false);
    }
  }

  if (phase === "boot") {
    return (
      <main className="mx-auto max-w-[1200px] px-4 pt-10 pb-16 lg:px-10">
        <p className="font-mono text-[13px] text-char">Loading account…</p>
      </main>
    );
  }

  if (phase === "none") {
    return <None busy={busy} error={error} onCreate={onCreate} onRecover={onRecover} />;
  }

  if (!address) return null;

  return (
    <AccountView
      address={address}
      balances={balances}
      positions={positions}
      hires={hires}
      error={error}
      next={next}
      revoking={revoking}
      walletBusy={walletBusy}
      depositExpanded={depositExpanded}
      onToggleDeposit={() => setDepositExpanded((v) => !v)}
      onRecover={onRecover}
      onRevoke={onRevoke}
      onRefresh={() => void refresh(address as `0x${string}`)}
      onSend={onSend}
      onWithdraw={onWithdraw}
    />
  );
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-xl border border-ink bg-buttercream p-3 text-sm text-status-red">{error}</p>
  );
}

function None({
  busy,
  error,
  onCreate,
  onRecover,
}: {
  busy: boolean;
  error: string | null;
  onCreate: () => void;
  onRecover: () => void;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem-120px)] items-center justify-center overflow-hidden p-6 sm:p-12">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
        <div className="h-[600px] w-[600px] rounded-full border border-oat/30 [mask-image:radial-gradient(circle,black_40%,transparent_70%)]" />
      </div>
      <section className="relative z-10 w-full max-w-[480px] rounded-[20px] border-2 border-ink bg-bone p-8 sm:p-12">
        <h1 className="mb-4 font-display text-[38px] leading-[44px] font-extrabold tracking-tight">
          Create account
        </h1>
        <p className="mb-10 text-[15px] leading-relaxed text-char">
          Your passkey creates a non-custodial smart account on BNB Chain. No seed phrase — keys stay
          on your device. Fund and hire from Account after signup.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCreate}
            className="group flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full border-[1.5px] border-ink bg-marigold text-[15px] font-bold transition-all hover:bg-marigold-dim active:translate-y-px disabled:opacity-60"
          >
            <Icon name="fingerprint" className="transition-transform group-hover:scale-110" />
            <span>{busy ? "Waiting for passkey…" : "Create account"}</span>
          </button>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Icon name="verified_user" className="text-[15px] text-char" />
            <span className="font-mono text-[11px] text-char uppercase">Passkey (WebAuthn)</span>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-char">
          Already have an account?{" "}
          <button type="button" disabled={busy} onClick={onRecover} className="font-bold underline">
            Sign in with passkey
          </button>
        </p>
        <ErrorNote error={error} />
      </section>
    </div>
  );
}

function AccountView({
  address,
  balances,
  positions,
  hires,
  error,
  next,
  revoking,
  walletBusy,
  depositExpanded,
  onToggleDeposit,
  onRecover,
  onRevoke,
  onRefresh,
  onSend,
  onWithdraw,
}: {
  address: string;
  balances: VaultBalances | null;
  positions: OpenPosition[];
  hires: StoredHire[];
  error: string | null;
  next: string;
  revoking: string | null;
  walletBusy: boolean;
  depositExpanded: boolean;
  onToggleDeposit: () => void;
  onRecover: () => void;
  onRevoke: (hire: StoredHire) => void;
  onRefresh: () => void;
  onSend: (asset: SendAsset, to: string, amount: string) => Promise<void>;
  onWithdraw: () => Promise<void>;
}) {
  const funded = balances?.funded ?? false;
  const active = useMemo(() => hires.filter((h) => h.status === "active"), [hires]);
  const activeHires = useMemo(
    () => hires.filter((h) => h.status === "active").sort((a, b) => b.createdAt - a.createdAt),
    [hires],
  );
  const agentByHire = (id: string) => AGENTS.find((a) => a.id === id);
  const deskByHire = (slug: string) => DESKS.find((d) => d.slug === slug);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-8 lg:px-10">
      <header className="flex w-full flex-col justify-between gap-4 rounded-xl border-2 border-ink bg-bone p-6 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[38px] font-extrabold tracking-tight">Account</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-0.5 font-mono text-[11px] ${
                funded ? "bg-marigold" : "bg-status-red/10 text-status-red"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full border border-ink ${funded ? "bg-status-green" : "bg-status-red"}`}
              />
              {funded ? "Funded" : "Add tBNB"}
            </span>
            {active.length > 0 ? (
              <span className="rounded-full border border-ink bg-[#f7eeca] px-2 py-0.5 font-mono text-[11px]">
                {active.length} active agent{active.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-char">
            <span className="font-mono text-sm font-medium text-ink">{shortAddress(address)}</span>
            <CopyButton value={address} />
            <span>·</span>
            <span>Passkey account · BNB testnet</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-bone px-4 py-2 text-sm font-bold hover:bg-[#f7eeca]"
          >
            <Icon name="refresh" className="text-base" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void onRecover()}
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-bone px-4 py-2 text-sm font-bold hover:bg-[#f7eeca]"
          >
            <Icon name="phonelink_lock" className="text-base" />
            Recover on new device
          </button>
          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-marigold px-4 py-2 text-sm font-bold hover:bg-marigold-dim"
          >
            Hire agent
          </Link>
        </div>
      </header>

      {!funded ? (
        <div className="rounded-xl border-2 border-ink bg-[#fdf4d0] px-5 py-4">
          <p className="font-display text-lg font-bold">Add tBNB to hire an agent</p>
          <p className="mt-1 text-[13px] text-char">
            Copy the address below or scan the QR code. Once funded, you can grant sessions from
            Market.
          </p>
        </div>
      ) : null}

      <AccountDepositCard
        address={address}
        balances={balances}
        funded={funded}
        expanded={depositExpanded}
        onToggle={onToggleDeposit}
      />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-bone p-6">
          <div className="flex items-center gap-2 border-b border-ink pb-4">
            <Icon name="payments" className="text-marigold" />
            <h2 className="font-display text-xl font-medium">Balances</h2>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] tracking-wider text-char uppercase">Gas reserve</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold tabular-nums">
                {balances?.nativeLabel ?? "—"}
              </span>
              <span className="font-display text-xl font-bold">tBNB</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono text-sm">
            <BalanceRow label="$U" value={balances?.uLabel ?? "0"} />
            <BalanceRow label="USDT" value={balances?.usdtLabel ?? "0"} />
            <BalanceRow label="USDC" value={balances?.usdcLabel ?? "0"} />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`${EXPLORER}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-bold underline"
            >
              BscScan <Icon name="open_in_new" />
            </a>
          </div>
        </div>

        <AccountSendPanel balances={balances} busy={walletBusy} onSend={onSend} />
      </section>

      <AccountWithdrawPanel
        positions={positions}
        busy={walletBusy}
        funded={funded}
        onWithdraw={onWithdraw}
      />

      <section className="flex flex-col gap-6 rounded-[20px] border-2 border-ink bg-bone p-6">
        <div className="flex flex-col justify-between gap-3 border-b-2 border-ink pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold">Active agents</h2>
            <p className="mt-0.5 text-[13px] text-char">
              Agents you hired on this device. Revoke stops them immediately.
            </p>
          </div>
          <span className="inline-flex self-start rounded-full border-2 border-ink bg-marigold px-3 py-1 font-mono text-sm font-bold sm:self-auto">
            {active.length} active
          </span>
        </div>

        {activeHires.length === 0 ? (
          <p className="text-char">
            No agents running right now.{" "}
            {hires.length > 0 ? (
              <>Past jobs are listed in Jobs &amp; activity below.</>
            ) : (
              <>
                <Link href="/market" className="font-bold underline">
                  Browse Market
                </Link>{" "}
                to grant your first session.
              </>
            )}
          </p>
        ) : (
          <AgentsTable
            hires={activeHires}
            revoking={revoking}
            onRevoke={onRevoke}
            agentByHire={agentByHire}
            deskByHire={deskByHire}
          />
        )}
      </section>

      <section className="flex flex-col gap-6 rounded-[20px] border-2 border-ink bg-bone p-6">
        <div className="border-b-2 border-ink pb-4">
          <h2 className="font-display text-2xl font-bold">Jobs & activity</h2>
          <p className="mt-0.5 text-[13px] text-char">
            Receipts for each hire. Open a job ticket to see grant proof and deliverables.
          </p>
        </div>

        {hires.length === 0 ? (
          <p className="text-[13px] text-char">
            Job tickets appear here after you hire an agent from Market.
          </p>
        ) : (
          <ul className="divide-y divide-ink">
            {hires.map((hire) => {
              const agent = agentByHire(hire.agentId);
              const desk = deskByHire(hire.desk);
              const hex = desk ? DESK_HEX[desk.slug] : "#666664";
              return (
                <li key={hire.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full border border-ink"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="font-sans text-[15px] font-bold">{agent?.name ?? hire.agentId}</span>
                      <span
                        className={`rounded-full border border-ink px-2 py-0.5 font-mono text-[10px] uppercase ${
                          hire.status === "active" ? "bg-status-green/10 text-status-green" : "bg-oat text-char"
                        }`}
                      >
                        {hire.status === "active" ? remainingLabel(hire.expiry) : "Revoked"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-char">
                      Last agent tick: <strong className="text-ink">Not indexed yet</strong>
                      {" · "}
                      Deliverable: <strong className="text-ink">Not indexed yet</strong>
                    </p>
                  </div>
                  <Link
                    href={`/jobs/${hire.id}`}
                    className="inline-flex shrink-0 items-center rounded-full border border-ink bg-marigold px-4 py-1.5 text-sm font-bold hover:bg-marigold-dim"
                  >
                    Open job ticket
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[20px] border-2 border-ink bg-bone p-6">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="analytics" />
          <h2 className="font-display text-xl font-medium">P&amp;L summary</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["Net yield", "Not measured yet"],
            ["Gas spent", "Not measured yet"],
            ["Key exposure", "0 private key leaks"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-ink bg-buttercream p-4">
              <span className="font-mono text-[11px] text-char uppercase">{label}</span>
              <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <ErrorNote error={error} />

      {next !== "/market" && funded ? (
        <Link
          href={next}
          className="inline-flex w-fit rounded-full border-2 border-ink bg-marigold px-6 py-3 text-sm font-bold hover:bg-marigold-dim"
        >
          Continue to hire →
        </Link>
      ) : null}
    </div>
  );
}

function BalanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink bg-[#fdf4d0] px-3 py-2">
      <span className="font-mono text-[10px] text-char uppercase">{label}</span>
      <p className="font-mono text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function AgentsTable({
  hires,
  revoking,
  onRevoke,
  agentByHire,
  deskByHire,
}: {
  hires: StoredHire[];
  revoking: string | null;
  onRevoke: (hire: StoredHire) => void;
  agentByHire: (id: string) => (typeof AGENTS)[number] | undefined;
  deskByHire: (slug: string) => (typeof DESKS)[number] | undefined;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink font-mono text-[11px] tracking-wider text-char uppercase">
            <th className="px-3 py-3">Agent</th>
            <th className="px-3 py-3">Category</th>
            <th className="px-3 py-3">Retainer</th>
            <th className="px-3 py-3">Lease</th>
            <th className="px-3 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink font-mono text-sm">
          {hires.map((hire) => {
            const agent = agentByHire(hire.agentId);
            const desk = deskByHire(hire.desk);
            const hex = desk ? DESK_HEX[desk.slug] : "#666664";
            const expiry = hire.status === "revoked" ? "REVOKED" : remainingLabel(hire.expiry);
            const isUrgent =
              hire.status === "active" && hire.expiry * 1000 - Date.now() < 24 * 60 * 60 * 1000;

            return (
              <tr key={hire.id} className="transition-colors hover:bg-[#fdf4d0]/50">
                <td className="px-3 py-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-ink"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="flex flex-col">
                      <Link
                        href={`/agents/${hire.agentId}`}
                        className="font-sans text-[15px] font-bold hover:underline"
                      >
                        {agent?.name ?? hire.agentId}
                      </Link>
                      <Link
                        href={`/jobs/${hire.id}`}
                        className="font-mono text-[11px] text-char hover:underline"
                      >
                        Job #{hire.id}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4">
                  {desk ? (
                    <span
                      className="inline-flex items-center rounded-full border border-ink px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider uppercase"
                      style={{ color: hex, backgroundColor: `${hex}26` }}
                    >
                      {desk.name}
                    </span>
                  ) : (
                    hire.desk
                  )}
                </td>
                <td className="px-3 py-4 font-medium">
                  {agent ? `${formatU(agent.priceWei)} $U` : "—"}
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border border-ink px-2 py-0.5 font-mono text-[11px] font-medium ${
                      hire.status === "revoked"
                        ? "bg-oat text-char"
                        : isUrgent
                          ? "bg-status-red/10 text-status-red"
                          : "bg-status-green/10 text-status-green"
                    }`}
                  >
                    {hire.status !== "revoked" ? <Icon name="alarm" className="text-[12px]" /> : null}
                    {expiry}
                  </span>
                </td>
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    disabled={revoking === hire.id}
                    onClick={() => onRevoke(hire)}
                    className="inline-flex items-center rounded-full border border-ink bg-bone px-3 py-1 font-mono text-[11px] font-bold hover:bg-[#f7eeca] disabled:opacity-60"
                  >
                    {revoking === hire.id ? "Revoking…" : "Revoke"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
