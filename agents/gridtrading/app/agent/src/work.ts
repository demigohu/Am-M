import { jsonSafe, runGridTick, runOnce } from "@am-m/agent-strategy";
import { generateText, stepCountIs } from "ai";
import { buildModel } from "./model.js";
import { executeSessionCalls } from "./signing.js";
import { strategyStatus } from "./tick.js";
import { LLM_READ_TOOLS } from "./tools.js";

export async function runHiredJob(
  prompt: string,
  abortSignal?: AbortSignal,
): Promise<string> {
  const reports = await runOnce(runGridTick, executeSessionCalls);
  const payload = jsonSafe({
    desk: "gridtrading",
    prompt,
    reports,
    lastTick: strategyStatus().last,
  });
  try {
    const { text } = await generateText({
      model: buildModel(),
      system:
        "You are the Grid seller. The runtime already ran PCS V3 swaps as a " +
        "synthetic grid (seed fill on first tick, then spacing). Explain the " +
        "JSON in Indonesian: fill, arah, hash, atau alasan diam. Do not invent hashes.",
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
