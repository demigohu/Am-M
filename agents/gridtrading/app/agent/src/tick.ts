import { createTickLoop, runGridTick, sessionPoliciesForLoadedSessions } from "@am-m/agent-strategy";
import { executeSessionCalls } from "./signing.js";

const loop = createTickLoop({
  desk: runGridTick,
  execute: executeSessionCalls,
});

export function startStrategyTick(): () => void {
  return loop.start();
}

export function strategyStatus() {
  return loop.status();
}

export function sessionStatus() {
  return sessionPoliciesForLoadedSessions();
}
