import { createTickLoop, runYieldTick } from "@am-m/agent-strategy";
import { executeSessionCalls } from "./signing.js";

const loop = createTickLoop({
  desk: runYieldTick,
  execute: executeSessionCalls,
});

export function startStrategyTick(): () => void {
  return loop.start();
}

export function strategyStatus() {
  return loop.status();
}
