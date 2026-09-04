"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyButton } from "../ui/CopyButton";
import { Icon } from "../ui/Icon";
import { readVault, type VaultBalances } from "../../lib/altana/balances";
import { altanaClient, errorMessage } from "../../lib/altana/client";
import { ALTANA_EXPLORER, EXPLORER, FAUCET_TBNB, FAUCET_U, urlBscTx } from "../../lib/altana/chain";
import { deleteSessionFile } from "../../lib/altana/persist";
import {
  getStoredWallet,
  listHires,
  remainingLabel,
  upsertHire,
  type StoredHire,
} from "../../lib/altana/storage";
import { shortAddress } from "../../lib/format";
import { createAccount, openWallet, recoverAccount } from "../../lib/altana/wallet";
import { AGENTS, DESKS } from "../../lib/catalog";

type Phase = "boot" | "none" | "unfunded" | "ready";

export function AccountHub({ next }: { next: string }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<VaultBalances | null>(null);
  const [hires, setHires] = useState<StoredHire[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const refresh = useCallback(async (addr: `0x${string}`) => {
    const vault = await readVault(addr);
    setBalances(vault);
    setHires(listHires().filter((h) => h.walletAddress.toLowerCase() === addr.toLowerCase()));
    setPhase(vault.funded ? "ready" : "unfunded");
  }, []);

  useEffect(() => {
    const stored = getStoredWallet();
    if (!stored) {
      setPhase("none");
      return;
    }
    setAddress(stored.address);
    void refresh(stored.address).catch((err) => {
      setError(errorMessage(err));
      setPhase("unfunded");
    });
  }, [refresh]);

  useEffect(() => {
    if (phase !== "unfunded" || !address) return;
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
        chainId: 97,
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

  if (phase === "unfunded") {
    return (
      <Unfunded
        address={address}
        balances={balances}
        error={error}
        next={next}
        onRefresh={() => void refresh(address as `0x${string}`)}
      />
    );
  }

  return (
    <Ready
      address={address}
      balances={balances}
      error={error}
      hires={hires}
      next={next}
      revoking={revoking}
      onRevoke={onRevoke}
      onRefresh={() => void refresh(address as `0x${string}`)}
    />
  );
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="mt-4 rounded-xl border border-ink bg-surface p-3 text-sm text-status-red">{error}</p>
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
    <main className="mx-auto max-w-[1200px] px-4 pt-10 pb-16 lg:px-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-2 font-mono text-[13px] text-char">
        <span>AM-M // ACCOUNT · NO PASSKEY · BNB TESTNET</span>
        <span>CREATE ACCOUNT HERE</span>
      </div>
      <section className="mx-auto max-w-xl rounded-[20px] border-2 border-ink bg-bone p-8">
        <div className="mb-4 flex items-center justify-between font-mono text-[13px]">
          <span className="inline-flex items-center gap-2">
            <Icon name="passkey" /> CREATE ACCOUNT
          </span>
          <span className="text-char">PASSKEY</span>
        </div>
        <h1 className="mb-3 font-display text-4xl font-extrabold tracking-tight">Create account</h1>
        <p className="mb-8 text-char">
          Face ID / Touch ID / hardware passkey on this page. That is the account. No seed phrase,
          no MetaMask login.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={onCreate}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-marigold px-6 py-3 text-sm font-bold hover:bg-marigold-dim disabled:opacity-60"
        >
          <Icon name="fingerprint" /> {busy ? "Waiting for passkey…" : "Create account"}
        </button>
        <p className="text-sm text-char">
          Already hold credentials?{" "}
          <button type="button" disabled={busy} onClick={onRecover} className="font-bold underline">
            Sign in with passkey
          </button>
        </p>
        <ErrorNote error={error} />
        <p className="mt-8 flex items-start gap-2 text-[13px] text-char">
          <Icon name="verified_user" className="mt-0.5 shrink-0" />
          The passkey stays on this device. The first hire registers the admin key on-chain so
          recovery works later.
        </p>
      </section>
    </main>
  );
}

function Unfunded({
  address,
  balances,
  error,
  next,
  onRefresh,
}: {
  address: string;
  balances: VaultBalances | null;
  error: string | null;
  next: string;
  onRefresh: () => void;
}) {
  return (
    <main className="mx-auto max-w-[1200px] px-4 pt-10 pb-16 lg:px-10">
      <div className="mb-8 font-mono text-[13px] text-char">
        AM-M // ACCOUNT · WAITING FOR GAS · BNB TESTNET
      </div>
      <section className="rounded-[20px] border-2 border-ink bg-bone p-8">
        <div className="mb-2 font-mono text-[13px] tracking-wider text-char uppercase">
          WALLET · NOT FUNDED YET
        </div>
        <h1 className="mb-3 font-display text-4xl font-extrabold tracking-tight">Fund this wallet</h1>
        <p className="mb-8 max-w-2xl text-char">
          Address exists; it is counterfactual until the first on-chain execute. Send at least 0.02
          tBNB so hire can register the admin key and grant a session. MetaMask is only for
          transferring in — not for login.
        </p>
        <div className="mb-6 rounded-xl border border-ink bg-surface p-4">
          <div className="mb-2 text-[13px] text-char">Deposit address</div>
          <div className="flex flex-wrap items-center gap-3">
            <code className="break-all font-mono text-sm md:text-lg">{address}</code>
            <CopyButton value={address} />
          </div>
          <p className="mt-2 font-mono text-[13px] text-char">
            Balance: {balances?.nativeLabel ?? "—"} tBNB
          </p>
        </div>
        <div className="mb-6 flex flex-wrap gap-4">
          <a
            href={FAUCET_TBNB}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold underline"
          >
            tBNB faucet <Icon name="north_east" />
          </a>
          <a
            href={FAUCET_U}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold underline"
          >
            $U faucet <Icon name="north_east" />
          </a>
        </div>
        <p className="mb-6 text-sm text-char">
          ~0.05 tBNB covers hire + ticks. $U is only needed if you want the optional ERC-8183
          retainer.
        </p>
        <p className="mb-6 font-mono text-[13px] text-char">Waiting for inbound tBNB…</p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex rounded-full border-2 border-ink bg-marigold px-6 py-3 text-sm font-bold hover:bg-marigold-dim"
        >
          I&apos;ve sent tBNB — check again
        </button>
        {next !== "/market" ? (
          <p className="mt-4 text-sm text-char">
            After funding you can continue to{" "}
            <Link href={next} className="font-bold underline">
              hire
            </Link>
            .
          </p>
        ) : null}
        <ErrorNote error={error} />
        <p className="mt-8 text-[13px] text-char">
          MetaMask can send tBNB here. It cannot log you in.
        </p>
      </section>
    </main>
  );
}

function Ready({
  address,
  balances,
  error,
  hires,
  next,
  revoking,
  onRevoke,
  onRefresh,
}: {
  address: string;
  balances: VaultBalances | null;
  error: string | null;
  hires: StoredHire[];
  next: string;
  revoking: string | null;
  onRevoke: (hire: StoredHire) => void;
  onRefresh: () => void;
}) {
  const active = useMemo(() => hires.filter((h) => h.status === "active"), [hires]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 pt-10 pb-16 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 font-mono text-[13px] text-char">
        <span>AM-M // ACCOUNT • PASSKEY • BNB TESTNET</span>
        <span>VAULT {shortAddress(address)} • FUNDED</span>
      </div>
      <h1 className="mb-8 font-display text-4xl font-extrabold tracking-tight">
        Account
      </h1>

      <section className="mb-8 rounded-[20px] border-2 border-ink bg-bone p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-medium">Balances</h2>
          <span className="rounded-full border border-ink px-3 py-1 font-mono text-[11px]">
            NON-CUSTODIAL
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <div className="text-[13px] text-char">tBNB (gas)</div>
            <div className="font-mono text-[28px] font-medium">{balances?.nativeLabel ?? "—"} BNB</div>
            <div className="text-[13px] text-char">BNB Chain testnet</div>
          </div>
          <div>
            <div className="text-[13px] text-char">Working capital</div>
            <div className="font-mono text-[28px] font-medium">{balances?.uLabel ?? "0"} $U</div>
            <div className="text-[13px] text-char">
              USDT {balances?.usdtLabel ?? "0"} · USDC {balances?.usdcLabel ?? "0"}
            </div>
          </div>
          <div>
            <div className="text-[13px] text-char">Address</div>
            <div className="break-all font-mono text-sm font-medium">{address}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <CopyButton value={address} />
              <a
                href={`${EXPLORER}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm underline"
              >
                BscScan <Icon name="open_in_new" />
              </a>
              <button type="button" onClick={onRefresh} className="text-sm underline">
                Refresh
              </button>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-char">
          Live testnet balances. P&amp;L waits on the indexer.
        </p>
      </section>

      <section className="rounded-[20px] border-2 border-ink bg-bone p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-medium">Active agents</h2>
          <span className="font-mono text-[13px]">{active.length} ACTIVE</span>
        </div>
        {hires.length === 0 ? (
          <p className="text-char">
            No sessions on this device yet.{" "}
            <Link href="/market" className="font-bold underline">
              Compare sellers
            </Link>{" "}
            or pick a desk from home.
          </p>
        ) : (
          <div className="space-y-4">
            {hires.map((hire) => {
              const agent = AGENTS.find((a) => a.id === hire.agentId);
              const desk = DESKS.find((d) => d.slug === hire.desk);
              return (
                <article key={hire.id} className="rounded-xl border border-ink p-5">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[11px] tracking-wider text-char">
                        {desk?.code ?? hire.desk.toUpperCase()} {desk?.name.toUpperCase() ?? ""}
                      </div>
                      <h3 className="font-display text-xl font-medium">
                        {agent?.name ?? hire.agentId}
                      </h3>
                    </div>
                    <span className="rounded-full border border-ink bg-surface px-3 py-1 font-mono text-[11px]">
                      {hire.status === "revoked" ? "REVOKED" : remainingLabel(hire.expiry)}
                    </span>
                  </div>
                  <p className="mb-2 font-mono text-[13px]">
                    Session {shortAddress(hire.publicKey)}
                    {hire.transactionHash ? (
                      <>
                        {" · "}
                        <a
                          className="underline"
                          href={urlBscTx(hire.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          grant {shortAddress(hire.transactionHash)}
                        </a>
                        {" · "}
                        <a
                          className="underline"
                          href={ALTANA_EXPLORER}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Altana
                        </a>
                      </>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={`/jobs/${hire.id}`} className="font-mono text-[12px] text-char underline">
                      Job #{hire.id}
                    </Link>
                    {hire.status === "active" ? (
                      <button
                        type="button"
                        disabled={revoking === hire.id}
                        onClick={() => onRevoke(hire)}
                        className="inline-flex items-center gap-1 rounded-full border border-ink px-4 py-1.5 text-sm font-bold hover:bg-oat disabled:opacity-60"
                      >
                        <Icon name="close" /> {revoking === hire.id ? "Revoking…" : "Revoke"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-6 text-[13px] text-char">
          Sessions expire on-chain at the grant deadline. Revoke here to stop that agent now.
        </p>
        <ErrorNote error={error} />
        {next !== "/market" ? (
          <Link
            href={next}
            className="mt-6 inline-flex rounded-full border-2 border-ink bg-marigold px-6 py-3 text-sm font-bold hover:bg-marigold-dim"
          >
            Continue to hire →
          </Link>
        ) : null}
      </section>
    </main>
  );
}
