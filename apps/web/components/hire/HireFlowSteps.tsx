"use client";

import { Icon } from "../ui/Icon";

export type HirePhase =
  | "idle"
  | "unlock"
  | "approve"
  | "approve_wait"
  | "grant"
  | "handoff"
  | "retainer";

export type ProtocolSetup = "unknown" | "needed" | "ready";

type StepVisual = "pending" | "active" | "done";

type FlowStep = {
  key: string;
  title: string;
  detail: string;
  visual: StepVisual;
};

function step1Visual(phase: HirePhase, protocolSetup: ProtocolSetup): StepVisual {
  if (phase === "approve" || phase === "approve_wait") return "active";
  if (phase === "grant" || phase === "handoff" || phase === "retainer") return "done";
  if (phase === "idle" && protocolSetup === "ready") return "done";
  return "pending";
}

function step2Visual(phase: HirePhase): StepVisual {
  if (phase === "grant") return "active";
  if (phase === "handoff" || phase === "retainer") return "done";
  return "pending";
}

function step3Visual(phase: HirePhase): StepVisual {
  if (phase === "handoff" || phase === "retainer") return "active";
  return "pending";
}

function buildSteps(
  phase: HirePhase,
  protocolSetup: ProtocolSetup,
  protocolLabel: string,
  liveDetail: string | null,
): FlowStep[] {
  const steps: FlowStep[] = [];

  const s1 = step1Visual(phase, protocolSetup);
  steps.push({
    key: "protocol",
    title: "Protocol setup",
    detail:
      phase === "approve"
        ? liveDetail ?? "Approve protocol (passkey)…"
        : phase === "approve_wait"
          ? liveDetail ?? "Waiting for Keystore nonce…"
          : s1 === "done"
            ? protocolSetup === "ready"
              ? `${protocolLabel} already approved`
              : `${protocolLabel} approved`
            : protocolSetup === "needed"
              ? `One-time ${protocolLabel} approve on grant`
              : "Checking vault approvals…",
    visual: s1,
  });

  const s2 = step2Visual(phase);
  steps.push({
    key: "grant",
    title: "Grant session",
    detail:
      phase === "grant"
        ? liveDetail ?? "Sign session delegation (passkey)…"
        : s2 === "done"
          ? "Session key registered on-chain"
          : phase === "unlock"
            ? liveDetail ?? "Unlocking passkey…"
            : "Allowlist, spend cap, and lease",
    visual: s2,
  });

  const s3 = step3Visual(phase);
  steps.push({
    key: "activate",
    title: "Activate agent",
    detail:
      phase === "retainer"
        ? liveDetail ?? "Paying ERC-8183 retainer…"
        : phase === "handoff"
          ? liveDetail ?? "Handing session to agent…"
          : "Indexer + agent pick up the session",
    visual: s3,
  });

  return steps;
}

function StepRow({ step, index }: { step: FlowStep; index: number }) {
  const isActive = step.visual === "active";
  const isDone = step.visual === "done";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
        isActive
          ? "border-2 border-ink bg-bone"
          : isDone
            ? "border border-ink bg-[#f7eeca]"
            : "border border-ink/40 bg-bone/60"
      }`}
    >
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink font-mono text-[11px] font-bold ${
          isDone
            ? "bg-status-green text-bone"
            : isActive
              ? "bg-marigold text-ink"
              : "bg-bone text-char"
        }`}
      >
        {isDone ? <Icon name="check" className="text-sm" /> : index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-bold ${isActive ? "text-ink" : isDone ? "text-ink" : "text-char"}`}>
          {step.title}
          {isActive ? (
            <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-marigold align-middle" />
          ) : null}
        </div>
        <div
          className={`truncate font-mono text-[11px] ${
            isDone ? "text-status-green" : isActive ? "text-ink" : "text-char"
          }`}
        >
          {step.detail}
        </div>
      </div>
    </div>
  );
}

export function HireFlowSteps({
  phase,
  protocolSetup,
  protocolLabel,
  liveDetail,
  compact = false,
}: {
  phase: HirePhase;
  protocolSetup: ProtocolSetup;
  protocolLabel: string;
  liveDetail: string | null;
  compact?: boolean;
}) {
  const steps = buildSteps(phase, protocolSetup, protocolLabel, liveDetail);

  return (
    <div className={compact ? "mb-4 space-y-2" : "mb-5 space-y-3"}>
      {steps.map((step, index) => (
        <StepRow key={step.key} step={step} index={index} />
      ))}
    </div>
  );
}
