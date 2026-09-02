import { jsonSafe, runOnce, runRebalanceTick } from "@am-m/agent-strategy";
import { generateText, stepCountIs } from "ai";
import { buildModel } from "./model.js";
import { executeSessionCalls } from "./signing.js";
import { LLM_READ_TOOLS } from "./tools.js";

export async function runHiredJob(
  prompt: string,
  abortSignal?: AbortSignal,
): Promise<string> {
  const reports = await runOnce(runRebalanceTick, executeSessionCalls);
  const payload = jsonSafe({ desk: "rebalancing", prompt, reports });
  try {
    const { text } = await generateText({
      model: buildModel(),
      system:
        "You are the Rebalance seller. The runtime already managed a PCS V3 LP. " +
        "Explain the JSON in Indonesian: range lama→baru, in-range, hash, " +
        "atau alasan tidak ada tx. Do not invent hashes.",
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
