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
import { CHAIN_ID, permissionsForDesk } from "../../lib/altana/chain";
import {
  buildSessionBudget,
  defaultSessionBudgetInput,
  sessionBudgetToGrantOpts,
  type SessionBudgetInput,
} from "../../lib/altana/sessionBudget";
import { altanaClient, errorMessage } from "../../lib/altana/client";
import { postSessionFile, patch8183Job } from "../../lib/altana/persist";
import { sleep, withNonceRetry } from "../../lib/altana/retry";
import { serializeSessionEnvelope } from "../../lib/altana/sessionEnvelope";
import { getStoredAddress, getStoredWallet, upsertHire } from "../../lib/altana/storage";
import { openWallet } from "../../lib/altana/wallet";
import { type Agent, type Desk } from "../../lib/catalog";
import { formatU } from "../../lib/format";
import { HireFlowSteps, type HirePhase, type ProtocolSetup } from "./HireFlowSteps";

export function HirePanel({
  agent,
  desk,
  variant = "default",
  budgetInput = defaultSessionBudgetInput(),
}: {
  agent: Agent;
  desk: Desk;
  variant?: "default" | "checkout";
  budgetInput?: SessionBudgetInput;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<HirePhase>("idle");
  const [liveDetail, setLiveDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [protocolSetup, setProtocolSetup] = useState<ProtocolSetup>("unknown");

  useEffect(() => {
    setHasWallet(Boolean(getStoredWallet()));
  }, []);

  useEffect(() => {
    const address = getStoredAddress();
    if (!address) {
      setProtocolSetup("unknown");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const adminCalls = await adminCallsForDesk(agent.desk, address);
        if (!cancelled) {
          setProtocolSetup(adminCalls.length > 0 ? "needed" : "ready");
        }
      } catch {
        if (!cancelled) setProtocolSetup("unknown");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agent.desk, hasWallet]);

  function setProgress(nextPhase: HirePhase, detail: string) {
    setPhase(nextPhase);
    setLiveDetail(detail);
  }

  async function onGrant() {
    if (!getStoredWallet()) {
      router.push(`/account?next=/hire/${agent.id}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setProgress("unlock", "Unlocking passkey…");
      const opened = await openWallet();
      const vault = await readVault(opened.address);
      if (!vault.funded) {
        router.push(`/account?next=/hire/${agent.id}`);
        return;
      }

      const client = altanaClient();
      const adminCalls = await adminCallsForDesk(agent.desk, opened.address);
      if (adminCalls.length > 0) {
        setProtocolSetup("needed");
        setProgress("approve", "Approve protocol (passkey)…");
        const approved = await client.execute({
          wallet: opened.wallet,
          signer: opened.signer,
          chainId: CHAIN_ID,
          calls: adminCalls,
        });
        if (approved.status === "FAILED") {
          throw new Error("Protocol approve failed. Check the vault on BscScan, then retry.");
        }
        setProtocolSetup("ready");
        setProgress("approve_wait", "Waiting for Keystore nonce…");
        await sleep(5_000);
      } else {
        setProtocolSetup("ready");
      }

      const sessionKey = generatePrivateKey();
      const sessionSigner = signerFromPrivateKey(sessionKey);
      const sessionBudget = buildSessionBudget(budgetInput);
      const expiry =
        Math.floor(Date.now() / 1000) + sessionBudget.leaseDays * 24 * 60 * 60;
      const permissions = permissionsForDesk(
        agent.desk,
        sessionBudgetToGrantOpts(sessionBudget),
      );

      setProgress("grant", "Grant session (passkey)…");
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
        sessionBudget,
      };
      upsertHire(hire);

      setProgress("handoff", "Handing session to agent…");
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
        setProgress("retainer", "Paying ERC-8183 retainer…");
        try {
          const paid = await hireErc8183Agent(
            opened.wallet,
            opened.signer,
            {
              provider: agent.wallet,
              task: `Am-M hire ${agent.name} (${agent.id})`,
              budget: BigInt(agent.priceWei),
            },
            { network: BNB_TESTNET },
          );
          if (paid.status !== "FAILED" && paid.jobId !== undefined) {
            const jobIdStr = paid.jobId.toString();
            upsertHire({ ...hire, erc8183JobId: jobIdStr });
            await patch8183Job(id, jobIdStr);
          }
        } catch {
          /* Altana track is the grant; retainer is bonus */
        }
      }

      router.push(`/jobs/${id}`);
    } catch (err) {
      setError(errorMessage(err));
      setPhase("idle");
      setLiveDetail(null);
    } finally {
      setBusy(false);
    }
  }

  const buttonLabel = busy
    ? liveDetail ?? "Working…"
    : `Grant session & pay ${formatU(agent.priceWei)} $U`;

  const flowSteps = (
    <HireFlowSteps
      phase={phase}
      protocolSetup={protocolSetup}
      protocolLabel={desk.protocol}
      liveDetail={liveDetail}
      compact={variant !== "checkout"}
    />
  );

  if (variant === "checkout") {
    return (
      <>
        {flowSteps}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onGrant()}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-marigold py-4 text-[15px] font-bold transition-all hover:bg-marigold-dim active:translate-y-px disabled:opacity-60"
        >
          <Icon name={busy ? "hourglass_empty" : "fingerprint"} />
          {buttonLabel}
        </button>
        {error ? (
          <p className="mt-3 rounded-xl border border-ink bg-buttercream p-3 text-[13px] text-status-red">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex items-start gap-2 text-char">
          <Icon name="security" className="mt-0.5 shrink-0" />
          <p className="text-[13px] leading-tight">
            Protected by WebAuthn passkey. Revoke anytime from{" "}
            <Link href="/account" className="font-bold underline">
              Account
            </Link>
            .
            {!hasWallet ? (
              <>
                {" "}
                <Link href={`/account?next=/hire/${agent.id}`} className="font-bold underline">
                  Create account
                </Link>{" "}
                first.
              </>
            ) : null}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {flowSteps}
      <button
        type="button"
        disabled={busy}
        onClick={() => void onGrant()}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-marigold px-5 py-3 text-sm font-bold hover:bg-marigold-dim disabled:opacity-60"
      >
        <Icon name={busy ? "hourglass_empty" : "fingerprint"} />
        {buttonLabel}
      </button>
      {error ? (
        <p className="mb-3 rounded-xl border border-ink bg-buttercream p-3 text-[13px] text-status-red">
          {error}
        </p>
      ) : null}
      <p className="text-[13px] text-char">
        Requires Touch ID / Face ID / WebAuthn hardware passkey signature.{" "}
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
