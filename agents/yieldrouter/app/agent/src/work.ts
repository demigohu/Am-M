import { jsonSafe, runOnce, runYieldTick } from "@am-m/agent-strategy";
import { generateText, stepCountIs } from "ai";
import { buildModel } from "./model.js";
import { executeSessionCalls } from "./signing.js";
import { LLM_READ_TOOLS } from "./tools.js";

export async function runHiredJob(
  prompt: string,
  abortSignal?: AbortSignal,
): Promise<string> {
  const reports = await runOnce(runYieldTick, executeSessionCalls);
  const payload = jsonSafe({ desk: "yieldrouter", prompt, reports });
  try {
    const { text } = await generateText({
      model: buildModel(),
      system:
        "You are the Yield seller. The runtime already rotated Venus vTokens. " +
        "Explain the JSON in Indonesian: vToken awal→akhir, APR testnet, hash, " +
        "atau alasan tidak ada tx. Do not invent hashes. Testnet route is Venus only.",
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
