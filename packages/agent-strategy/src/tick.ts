import type { Session } from "@altananetwork/sdk";
import type { DeskRunner } from "./desks.js";
import { loadSessionPolicies } from "./session-policy.js";
import { loadUserSessions } from "./sessions.js";
import { jsonSafe, riskProfile, type ExecuteFn, type TickReport } from "./types.js";

export type TickLoop = {
  last: TickReport[] | { skipped: string } | { idle: string };
  running: boolean;
};

const log = {
  info: (msg: string) => console.log(`[strategy.tick] ${msg}`),
  warn: (msg: string) => console.warn(`[strategy.tick] ${msg}`),
  error: (msg: string, e?: unknown) =>
    console.error(`[strategy.tick] ${msg}`, e ?? ""),
};

export function createTickLoop(opts: {
  desk: DeskRunner;
  execute: ExecuteFn;
  intervalMs?: number;
}): { start: () => () => void; status: () => TickLoop } {
  const intervalMs =
    opts.intervalMs ??
    Number(process.env.TICK_INTERVAL_MS || 120_000);
  const state: TickLoop = { last: { idle: "not started" }, running: false };
  let locked = false;

  const tick = async (): Promise<void> => {
    if (locked) {
      log.warn("skip overlapping tick");
      state.last = { skipped: "overlap" };
      return;
    }
    locked = true;
    state.running = true;
    try {
      const sessions = await loadUserSessions();
      if (sessions.length === 0) {
        state.last = {
          idle: "no USER_SESSION / USER_SESSION_FILE / USER_SESSIONS_DIR",
        };
        log.info("no user session — tick idle (not agent wallet).");
        return;
      }
      const variant = riskProfile();
      const reports: TickReport[] = [];
      for (const session of sessions) {
        try {
          const report = await opts.desk({
            session,
            variant,
            execute: opts.execute,
          });
          reports.push(report);
          log.info(
            `${report.desk} ${report.wallet} ${report.action.kind} ${report.action.reason}${
              report.execution?.transactionHash
                ? ` tx=${report.execution.transactionHash}`
                : ""
            }`,
          );
        } catch (e) {
          log.error(
            `session ${session.walletAddress} failed (continuing with next session)`,
            e,
          );
        }
      }
      state.last = jsonSafe(reports) as TickReport[];
    } catch (e) {
      log.error("tick failed", e);
    } finally {
      locked = false;
      state.running = false;
    }
  };

  return {
    status: () => state,
    start: () => {
      log.info(`interval ${intervalMs}ms variant=${riskProfile()}`);
      // Ponder binds :42069 a few seconds after pm2 start — don't race the first tick.
      const first = setTimeout(() => {
        void tick();
      }, 5_000);
      const id = setInterval(() => {
        void tick();
      }, intervalMs);
      return () => {
        clearTimeout(first);
        clearInterval(id);
      };
    },
  };
}

/** User-facing session policy for all loaded sessions (no private keys). */
export async function sessionPoliciesForLoadedSessions(): Promise<
  Awaited<ReturnType<typeof loadSessionPolicies>> | { idle: string }
> {
  const sessions = await loadUserSessions();
  if (sessions.length === 0) {
    return { idle: "no USER_SESSION / USER_SESSION_FILE / USER_SESSIONS_DIR" };
  }
  return loadSessionPolicies(sessions);
}

export async function runOnce(
  desk: DeskRunner,
  execute: ExecuteFn,
  sessions?: Session[],
): Promise<TickReport[] | { idle: string }> {
  const list = sessions ?? (await loadUserSessions());
  if (list.length === 0) {
    return { idle: "no user sessions" };
  }
  const variant = riskProfile();
  const reports: TickReport[] = [];
  for (const session of list) {
    reports.push(await desk({ session, variant, execute }));
  }
  return reports;
}
