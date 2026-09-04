"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BNB_TESTNET,
  hireErc8183Agent,
  signerFromPrivateKey,
} from "@altananetwork/sdk";
import { generatePrivateKey } from "viem/accounts";
import { Icon } from "../ui/Icon";
import { adminCallsForDesk } from "../../lib/altana/approvals";
import { readVault } from "../../lib/altana/balances";
import { CHAIN_ID, permissionsForDesk, SESSION_DAYS } from "../../lib/altana/chain";
import { altanaClient, errorMessage } from "../../lib/altana/client";
import { postSessionFile } from "../../lib/altana/persist";
import { sleep, withNonceRetry } from "../../lib/altana/retry";
import { serializeSessionEnvelope } from "../../lib/altana/sessionEnvelope";
import { getStoredWallet, upsertHire } from "../../lib/altana/storage";
import { openWallet } from "../../lib/altana/wallet";
import { DESK_PROVIDER, type Agent, type Desk } from "../../lib/catalog";
import { formatU } from "../../lib/format";

export function HirePanel({ agent, desk }: { agent: Agent; desk: Desk }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    setHasWallet(Boolean(getStoredWallet()));
  }, []);

  async function onGrant() {
    if (!getStoredWallet()) {
      router.push(`/account?next=/hire/${agent.id}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setStep("Unlocking passkey…");
      const opened = await openWallet();
      const vault = await readVault(opened.address);
      if (!vault.funded) {
        router.push(`/account?next=/hire/${agent.id}`);
        return;
      }

      const client = altanaClient();
      const adminCalls = await adminCallsForDesk(agent.desk, opened.address);
      if (adminCalls.length > 0) {
        setStep("Approve protocol (passkey)…");
        const approved = await client.execute({
          wallet: opened.wallet,
          signer: opened.signer,
          chainId: CHAIN_ID,
          calls: adminCalls,
        });
        if (approved.status === "FAILED") {
          throw new Error("Protocol approve failed. Check the vault on BscScan, then retry.");
        }
        setStep("Waiting for Keystore nonce…");
        await sleep(5_000);
      }

      const sessionKey = generatePrivateKey();
      const sessionSigner = signerFromPrivateKey(sessionKey);
      const expiry = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
      const permissions = permissionsForDesk(agent.desk);

      setStep("Grant session (passkey)…");
      const granted = await withNonceRetry(() =>
        client.grantSession({
          wallet: opened.wallet,
          signer: opened.signer,
          sessionSigner,
          permissions,
          expiry,
          register: true,
          chainId: CHAIN_ID,
        }),
      );

      const id = `s-${granted.publicKey.slice(2, 10).toLowerCase()}`;
      const envelope = serializeSessionEnvelope(
        { ...granted, signer: sessionSigner },
        sessionKey,
      );
      const hire = {
        id,
        agentId: agent.id,
        desk: agent.desk,
        walletAddress: opened.address,
        privateKey: sessionKey,
        publicKey: granted.publicKey,
        expiry,
        transactionHash: granted.transactionHash,
        envelope,
        createdAt: Date.now(),
        status: "active" as const,
      };
      upsertHire(hire);

      setStep("Handing session to agent…");
      try {
        await postSessionFile({
          id,
          agentId: agent.id,
          desk: agent.desk,
          envelope,
          wallet: opened.address,
          publicKey: granted.publicKey,
          expiry,
          grantTx: granted.transactionHash,
        });
      } catch (persistErr) {
        setError(
          `Session granted on-chain, but the agent file was not written: ${errorMessage(persistErr)}. Order is still saved on this device.`,
        );
      }

      if (vault.u > 0n) {
        setStep("Paying ERC-8183 retainer…");
        try {
          const paid = await hireErc8183Agent(
            opened.wallet,
            opened.signer,
            {
              provider: DESK_PROVIDER[agent.desk],
              task: `Am-M hire ${agent.name} (${agent.id})`,
              budget: BigInt(agent.priceWei),
            },
            { network: BNB_TESTNET },
          );
          if (paid.status !== "FAILED" && paid.jobId !== undefined) {
            upsertHire({ ...hire, erc8183JobId: paid.jobId.toString() });
          }
        } catch {
          /* Altana track is the grant; retainer is bonus */
        }
      }

      router.push(`/jobs/${id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      setStep(null);
    }
  }

  return (
    <>
      <ol className="mb-6 space-y-3 text-sm">
        <li className="flex gap-3">
          <Icon name="check" className="text-status-green" />
          <span>
            <strong>Step 1: Approve protocol (once)</strong>
            <span className="block text-char">
              {desk.name} tokens are approved on the admin path before the session grant.
            </span>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-ink text-xs font-bold">
            2
          </span>
          <span>
            <strong>Step 2: Grant session</strong>
            <span className="block text-char">Passkey signs the Keystore grant (allowlist, cap, expiry).</span>
          </span>
        </li>
      </ol>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onGrant()}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-marigold px-5 py-3 text-sm font-bold hover:bg-marigold-dim disabled:opacity-60"
      >
        <Icon name="fingerprint" />
        {busy ? step ?? "Working…" : `Grant session · ${formatU(agent.priceWei)} $U`}
      </button>
      {error ? (
        <p className="mb-3 rounded-xl border border-ink bg-surface p-3 text-[13px] text-status-red">
          {error}
        </p>
      ) : null}
      <p className="text-[13px] text-char">
        Requires Touch ID / Face ID / WebAuthn hardware passkey signature. Session private key is
        scoped, expiring, and revocable.{" "}
        {!hasWallet ? (
          <>
            No account yet?{" "}
            <Link href={`/account?next=/hire/${agent.id}`} className="underline">
              Create account
            </Link>{" "}
            first.
          </>
        ) : (
          <>
            Revoke anytime from{" "}
            <Link href="/account" className="underline">
              Account
            </Link>
            .
          </>
        )}
      </p>
    </>
  );
}
