import {
  jsonSafe,
  runGuardTick,
  runOnce,
} from "@am-m/agent-strategy";
import { generateText, stepCountIs } from "ai";
import { buildModel } from "./model.js";
import { executeSessionCalls } from "./signing.js";
import { LLM_READ_TOOLS } from "./tools.js";

/**
 * ERC-8183 deliverable: one Guard cycle on every loaded user session,
 * then (if an LLM key exists) a human explanation. Execution is fixed
 * code; the LLM never builds calldata.
 */
export async function runHiredJob(
  prompt: string,
  abortSignal?: AbortSignal,
): Promise<string> {
  const reports = await runOnce(runGuardTick, executeSessionCalls);
  const payload = jsonSafe({ desk: "healthfactor", prompt, reports });
  try {
    const { text } = await generateText({
      model: buildModel(),
      system:
        "You are the Guard (health-factor) seller. The runtime already ran " +
        "the Venus repay/mint cycle. Explain the JSON to the buyer in " +
        "Indonesian: HF, aksi, hash tx, atau alasan jujur kenapa tidak ada tx. " +
        "Do not invent hashes.",
      prompt: JSON.stringify(payload, null, 2),
      tools: LLM_READ_TOOLS,
      stopWhen: stepCountIs(4),
      abortSignal,
    });
    return `${text.trim()}\n\n---\n${JSON.stringify(payload, null, 2)}`;
  } catch {
    return JSON.stringify(payload, null, 2);
  }
}
